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
   */

  async create(
    userId: string,
    data: {
      name: string;
      location: string;
      logoUrl?: string;
    },
  ) {
    const userIdInt = Number(userId);

    const exists = await this.prisma.provider.findUnique({
      where: { userId: userIdInt },
    });

    if (exists) {
      throw new ConflictException('El usuario ya tiene un proveedor');
    }

    // 🧠 BRAIN BLAST: Crear la "Subcategoría" en WP primero
    // Nota: Si quieres que estén bajo una categoría madre "Proveedores",
    // pasa el ID de esa categoría en 'parent'. Si no, déjalo en 0 (raíz).
    const wpCategory = await this.wpService.createCategory({
      name: data.name, // El nombre del proveedor es el nombre de la categoría
      image: data.logoUrl ? { src: data.logoUrl } : undefined,
    });

    // Guardamos en Prisma.
    // IMPORTANTE: Deberías agregar un campo 'wpTermId' a tu modelo Provider en Prisma
    // para enlazarlo fuertemente, pero por ahora asumiremos que se sincronizan por lógica.
    return this.prisma.provider.create({
      data: {
        ...data,
        userId: userIdInt,
        // Aquí podrías guardar wpCategory.id si actualizas tu schema.prisma
      },
    });
  }

  // ... (Mantén tus métodos findByUser, findById, list iguales, usando Prisma para lectura rápida)
  async findByUser(userId: string) {
    return this.prisma.provider.findUnique({
      where: { userId: Number(userId) },
      include: { user: true }, // Quitamos services temporalmente si cambia la relación
    });
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
