import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  RegisterUserInput,
  UpdateUserInput,
} from 'src/graphql/entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene todos los usuarios
   */
  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { registered: 'desc' },
      include: {
        provider: true, // Incluimos info básica de proveedor si existe
      },
    });
  }

  /**
   * Busca un usuario por ID con todas sus relaciones alineadas
   */
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        provider: {
          include: {
            hobbys: true,
            bank: true,
            services: {
              include: {
                service: {
                  include: {
                    category: true,
                  },
                },
              },
            },
            reviews: true,
            certificates: true,
          },
        },
        orders: {
          include: {
            serviceProvider: {
              include: {
                service: true,
                provider: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  /**
   * Crea un usuario nuevo (Registro)
   * Eliminado rastro de wp_capabilities y usermeta.
   */
  async create(input: RegisterUserInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    // Usamos bcrypt estándar para el hash de contraseña
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Generamos un username si no viene uno
    const baseUsername = input.username || input.email.split('@')[0];
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const finalUsername = `${baseUsername}_${uniqueSuffix}`;

    return this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        username: finalUsername,
        displayName: input.displayName || baseUsername,
        nicename: finalUsername.toLowerCase(),
        role: input.role, // CLIENT, PROVIDER o ADMIN según el enum alineado
        status: 1, // Usuario activo por defecto
        url: '',
        activationKey: '',
        registered: new Date(),
      },
    });
  }

  /**
   * Actualiza el perfil del usuario
   */
  async updateProfile(id: number, input: UpdateUserInput) {
    // Verificamos si el usuario existe
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        email: input.email,
        displayName: input.displayName,
        url: input.url,
        nicename: input.nicename,
        // Si se necesita actualizar el teléfono, se hace en la tabla Provider
        // o se añade la columna phone a User en el schema.
      },
    });
  }

  /**
   * Busca un usuario por email (útil para Auth)
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Elimina un usuario y sus registros dependientes
   */
  async remove(id: number) {
    // El borrado en cascada dependerá de cómo esté configurado en Prisma (onDelete: Cascade)
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
