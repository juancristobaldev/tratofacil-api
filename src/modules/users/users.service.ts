import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  RegisterInput,
  UpdateUserInput,
} from 'src/graphql/entities/user.entity';
import { Role } from 'src/graphql/enums/role.enum';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Utilidad para serializar roles al estilo WordPress PHP
  private getWpCapabilities(role: Role): string {
    let wpRole = 'subscriber';

    if (role === Role.ADMIN) {
      wpRole = 'administrator';
    }

    if (role === Role.PROVIDER) {
      wpRole = 'vendor';
    }

    return `a:1:{s:${wpRole.length}:"${wpRole}";b:1;}`;
  }

  // Utilidad para deserializar roles
  private getRoleFromMeta(metaValue: string): Role {
    if (metaValue.includes('"administrator"')) {
      return Role.ADMIN;
    }

    if (metaValue.includes('"vendor"')) {
      return Role.PROVIDER;
    }

    return Role.CLIENT;
  }

  // Helper para asignar el rol a la entidad de salida
  private mapUserRole(user: any) {
    const capMeta = user.usermeta?.find(
      (m: any) => m.key === 'wp_capabilities',
    );

    const role = capMeta?.value
      ? this.getRoleFromMeta(capMeta.value)
      : Role.CLIENT;

    return {
      ...user,
      role,
    };
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { registered: 'desc' },
      include: { usermeta: true },
    });
    return users.map((user) => this.mapUserRole(user));
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        usermeta: true,
        provider: {
          include: {
            bank: true,
          },
        },
      },
    });

    console.log({ user });

    if (!user) throw new NotFoundException(`Usuario ID ${id} no encontrado`);

    const mapUser = this.mapUserRole(user);
    console.log({ mapUser });

    return { ...mapUser };
  }

  async create(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) throw new BadRequestException('El correo ya existe');

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const username = input.username || input.email.split('@')[0];
    const nicename = username.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const displayName = input.displayName || username;

    const metaData = [
      { key: 'nickname', value: username },
      { key: 'first_name', value: displayName },
      { key: 'wp_capabilities', value: this.getWpCapabilities(input.role) },
      { key: 'wp_user_level', value: input.role === Role.ADMIN ? '10' : '0' },
    ];

    if (input.phone) {
      metaData.push({ key: 'billing_phone', value: input.phone });
    }

    const newUser = await this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        username: username,
        nicename: nicename,
        displayName: displayName,
        registered: new Date(),
        url: '',
        status: 0,
        activationKey: '',
        usermeta: {
          create: metaData,
        },
      },
      include: { usermeta: true },
    });

    return this.mapUserRole(newUser);
  }

  // ======================================================
  // CORRECCIÓN AQUÍ: Renombrado a updateProfile
  // ======================================================
  async updateProfile(id: number, input: UpdateUserInput) {
    // Manejo de metadatos (Teléfono)
    if (input.phone) {
      const meta = await this.prisma.userMeta.findFirst({
        where: { userId: id, key: 'billing_phone' },
      });

      if (meta) {
        await this.prisma.userMeta.update({
          where: { umeta_id: meta.umeta_id },
          data: { value: input.phone },
        });
      } else {
        await this.prisma.userMeta.create({
          data: { userId: id, key: 'billing_phone', value: input.phone },
        });
      }
    }

    // Actualizamos campos base del usuario si vienen en el input
    const updateData: any = {};
    if (input.email) updateData.email = input.email;
    if (input.displayName) updateData.displayName = input.displayName;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { usermeta: true },
    });

    return this.mapUserRole(updatedUser);
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { usermeta: true },
    });
    if (user) return this.mapUserRole(user);
    return null;
  }
}
