import { Injectable } from '@nestjs/common';
import { Role } from 'src/graphql/enums/role.enum';
import { GraphQLError } from 'graphql/error';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserInput } from 'src/graphql/entities/user.entity';

// LIBRERÍAS DE COMPATIBILIDAD WP
import * as wpHash from 'wordpress-hash-node';
import * as PHP from 'php-serialize';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { registered: 'desc' },
      include: { usermeta: true },
    });
  }

  async findOne(id: number): Promise<any> {
    // Usar 'any' o un Partial<User> evita el choque de tipos estricto
    return this.prisma.user.findUnique({
      where: { id },
      include: { usermeta: true },
    });
  }

  /**
   * CREAR USUARIO COMPATIBLE CON WORDPRESS
   * Maneja el hashing PHPass y la serialización de roles en PHP
   */
  async createWpUser(data: {
    email: string;
    password: string;
    displayName: string;
    role: Role;
    phone?: string;
  }) {
    // 1. Hashing al estilo WordPress (PHPass)
    const hashedPassword = wpHash.HashPassword(data.password);

    // 2. Serialización de rol para wp_capabilities
    const roleKey = data.role.toLowerCase();
    const capabilities = PHP.serialize({ [roleKey]: true });

    // 3. Generar nombres básicos
    const username = data.email.split('@')[0];

    return this.prisma.$transaction(async (tx) => {
      // Crear en wp_users
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          username: username,
          nicename: username,
          displayName: data.displayName,
          status: 0,
        },
      });

      // Crear metadatos obligatorios para WP
      const metas = [
        { key: 'wp_capabilities', value: capabilities },
        { key: 'wp_user_level', value: data.role === Role.ADMIN ? '10' : '0' },
      ];

      if (data.phone) {
        metas.push({ key: 'billing_phone', value: data.phone });
      }

      await tx.userMeta.createMany({
        data: metas.map((m) => ({
          userId: user.id,
          key: m.key,
          value: m.value,
        })),
      });

      return user;
    });
  }

  /**
   * ACTUALIZAR USUARIO Y METADATOS
   */
  // src/modules/users/user.service.ts

  async update(id: number, data: UpdateUserInput) {
    // Extraemos phone para manejarlo en UserMeta, el resto va a User
    const { phone, email, displayName, url, nicename } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Actualizar la tabla principal wp_users
      // Solo incluimos los campos que no son undefined
      const user = await tx.user.update({
        where: { id },
        data: {
          ...(email && { email }),
          ...(displayName && { displayName }),
          ...(url && { url }),
          ...(nicename && { nicename }),
        },
        include: { usermeta: true },
      });

      // 2. Si viene el teléfono, manejar wp_usermeta (billing_phone)
      if (phone) {
        const metaKey = 'billing_phone';
        const existingMeta = await tx.userMeta.findFirst({
          where: { userId: id, key: metaKey },
        });

        if (existingMeta) {
          await tx.userMeta.update({
            where: { umeta_id: existingMeta.umeta_id },
            data: { value: phone },
          });
        } else {
          await tx.userMeta.create({
            data: {
              userId: id,
              key: metaKey,
              value: phone,
            },
          });
        }
      }

      return user;
    });
  }

  async changeRole(userId: number, role: Role) {
    await this.findOne(userId);
    const roleKey = role.toLowerCase();
    const serializedValue = `a:1:{s:${roleKey.length}:"${roleKey}";b:1;}`;

    const existingMeta = await this.prisma.userMeta.findFirst({
      where: { userId, key: 'wp_capabilities' },
    });

    if (existingMeta) {
      return this.prisma.userMeta.update({
        where: { umeta_id: existingMeta.umeta_id },
        data: { value: serializedValue },
      });
    } else {
      return this.prisma.userMeta.create({
        data: { userId, key: 'wp_capabilities', value: serializedValue },
      });
    }
  }

  // --- MÉTODOS DE VERIFICACIÓN ---

  async createEmailVerification(email: string, code: string) {
    return this.prisma.emailVerification.upsert({
      where: { email },
      update: { code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      create: { email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });
  }

  async validateEmailCode(email: string, code: string) {
    const record = await this.prisma.emailVerification.findUnique({
      where: { email },
    });
    if (!record || record.code !== code) throw new GraphQLError('INVALID CODE');
    if (record.expiresAt < new Date()) throw new GraphQLError('CODE EXPIRED');
    await this.prisma.emailVerification.delete({ where: { email } });
    return true;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }
}
