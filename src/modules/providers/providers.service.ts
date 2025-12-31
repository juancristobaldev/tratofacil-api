import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProviderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear proveedor (1–1 con User)
   */
  async create(
    userId: string,
    data: {
      name: string;
      location: string;
      logoUrl?: string;
    },
  ) {
    // Convertir userId a Number ya que en el schema es Int
    const userIdInt = Number(userId);

    const exists = await this.prisma.provider.findUnique({
      where: { userId: userIdInt },
    });

    if (exists) {
      throw new ConflictException('El usuario ya tiene un proveedor');
    }

    return this.prisma.provider.create({
      data: {
        ...data,
        userId: userIdInt,
        // createdAt se llena automáticamente por @default(now())
      },
    });
  }

  /**
   * Obtener proveedor por userId
   */
  async findByUser(userId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId: Number(userId) },
      include: {
        services: true, // Relación con subcategorías de WordPress
        user: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return provider;
  }

  /**
   * Obtener proveedor por id
   */
  async findById(id: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: Number(id) },
      include: {
        services: true,
        user: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return provider;
  }

  /**
   * Listar todos los proveedores
   */
  list() {
    return this.prisma.provider.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
