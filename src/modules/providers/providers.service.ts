import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateProviderInput,
  UpdateProviderInput,
} from 'src/graphql/entities/provider.entity';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  // Generador simple de slugs
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(userId: number, input: CreateProviderInput) {
    // 1. Verificar si el usuario ya es proveedor
    const existing = await this.prisma.provider.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new BadRequestException(
        'El usuario ya tiene un perfil de proveedor',
      );
    }

    // 2. Generar slug único (añadir sufijo si existe)
    let slug = this.generateSlug(input.name);
    const slugExists = await this.prisma.provider.findUnique({
      where: { slug },
    });
    if (slugExists) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    // 3. Crear Proveedor y Cuenta Bancaria (si viene en el input)
    return this.prisma.provider.create({
      data: {
        userId,
        name: input.name,
        slug,
        location: input.location,
        logoUrl: input.logoUrl,
        bio: input.bio,
        phone: input.phone,
        // Conexión anidada para crear la cuenta bancaria en la misma transacción
        ...(input.bank && {
          bank: {
            create: {
              ...input.bank,
            },
          },
        }),
      },
      include: { bank: true },
    });
  }

  async update(userId: number, input: UpdateProviderInput) {
    // 1. Validar propiedad
    const provider = await this.prisma.provider.findUnique({
      where: { id: input.id },
    });

    if (!provider) throw new NotFoundException('Proveedor no encontrado');
    if (provider.userId !== userId) {
      throw new BadRequestException(
        'No tienes permiso para editar este perfil',
      );
    }

    // 2. Actualizar (Upsert para el banco: crea si no existe, actualiza si existe)
    return this.prisma.provider.update({
      where: { id: input.id },
      data: {
        name: input.name,
        location: input.location,
        logoUrl: input.logoUrl,
        bio: input.bio,
        phone: input.phone,
        ...(input.bank && {
          bank: {
            upsert: {
              create: { ...input.bank },
              update: { ...input.bank },
            },
          },
        }),
      },
      include: { bank: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.provider.findUnique({
      where: { id },
      include: { bank: true },
    });
  }

  async findByUserId(userId: number) {
    return this.prisma.provider.findUnique({
      where: { userId },
      include: { bank: true },
    });
  }

  async findAll() {
    return this.prisma.provider.findMany({
      include: { bank: true },
    });
  }
}
