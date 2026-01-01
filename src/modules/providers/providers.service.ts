import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WordpressService } from '../wordpress/wordpress.service';

@Injectable()
export class ProviderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wpService: WordpressService,
  ) {}

  /**
   * Crear proveedor (1–1 con User)
   * ALINEACIÓN: Crea una Categoría en WP para el proveedor
   */
  async create(
    userId: string,
    data: {
      name: string;
      location: string;
      logoUrl?: string;
    },
  ) {
    // Convertir userId a Number
    const userIdInt = Number(userId);

    const exists = await this.prisma.provider.findUnique({
      where: { userId: userIdInt },
    });

    if (exists) {
      throw new ConflictException('El usuario ya tiene un proveedor');
    }

    // 1. Crear la "Categoría de Proveedor" en WP
    // Esto crea una entidad en WooCommerce para agrupar sus servicios
    const wpCategory = await this.wpService.createCategory({
      name: data.name,
      description: `Servicios ofrecidos por ${data.name} en ${data.location}`,
      image: data.logoUrl ? { src: data.logoUrl } : undefined,
    });

    // 2. Guardar en Base de Datos Local
    return this.prisma.provider.create({
      data: {
        ...data,
        userId: userIdInt,
        // Si en el futuro agregas 'wcCategoryId' a tu schema.prisma, descomenta esto:
        // wcCategoryId: wpCategory.id,
      },
    });
  }

  /**
   * Obtener proveedor por userId (Lectura Prisma)
   */
  async findByUser(userId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId: Number(userId) },
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
   * Obtener proveedor por id (Lectura Prisma)
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
   * Listar todos los proveedores (Lectura Prisma)
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
