import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear categoría
   */
  async create(data: {
    name: string;
    slug: string;
    imageUrl?: string;
  }) {
    const exists = await this.prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (exists) {
      throw new ConflictException('La categoría ya existe');
    }

    return this.prisma.category.create({
      data,
    });
  }

  /**
   * Listar categorías
   */
  list() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Obtener categoría por slug
   */
  findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
      include: {
        services: true,
      },
    });
  }
}
