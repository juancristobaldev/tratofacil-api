import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WordpressService } from '../wordpress/wordpress.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wpService: WordpressService,
  ) {}

  /**
   * Crear categoría:
   * Usa la API de WordPress para escribir (garantiza integridad en wp_terms y wp_term_taxonomy).
   */
  async create(data: { name: string; slug: string; imageUrl?: string }) {
    // 1. Verificación rápida de duplicados usando lectura local
    const exists = await this.prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (exists) {
      throw new ConflictException('La categoría ya existe');
    }

    // 2. Creación segura en WordPress vía API
    const wpCategory = await this.wpService.createCategory({
      name: data.name,
      slug: data.slug,
      image: data.imageUrl ? { src: data.imageUrl } : undefined,
    });

    // 3. Retornamos el objeto creado (mapeado desde la respuesta de WP)
    return {
      id: wpCategory.id,
      name: wpCategory.name,
      slug: wpCategory.slug,
      description: wpCategory.description,
    };
  }

  /**
   * Listar categorías:
   * Usa Prisma para lectura directa (Máxima velocidad).
   */
  list() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Obtener por slug:
   * Usa Prisma para lectura directa.
   */
  findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
      include: {
        services: true, // Incluye subcategorías/servicios si el schema lo permite
      },
    });
  }
}
