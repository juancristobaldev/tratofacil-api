import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WordpressService } from '../wordpress/wordpress.service';
import { CreateCategoryInput } from 'src/graphql/entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wpService: WordpressService,
  ) {}

  /**
   * Crear Rubro (Categoría en WP)
   */
  async create(data: CreateCategoryInput) {
    // 1. Crear vía API para que WP genere los registros en term_taxonomy
    const wpCat = await this.wpService.createCategory({
      name: data.name,
      slug: data.slug,
      description: data.description,
      parent: data.parentId,
    });

    return {
      id: Number(wpCat.id),
      name: wpCat.name,
      slug: wpCat.slug,
      description: wpCat.description,
      parentId: wpCat.parent,
    };
  }

  /**
   * Listar Categorías (Lectura directa Prisma)
   */

  async listWithParent() {
    const taxonomies = await this.prisma.wpTermTaxonomy.findMany({
      where: {
        taxonomy: 'product_cat',
        parent: {
          not: 0, // 👈 SOLO subcategorías
        },
      },
      include: {
        term: true,
      },
    });

    return taxonomies.map((t) => ({
      id: Number(t.term_id),
      name: t.term.name,
      slug: t.term.slug,
      description: t.description,
      parentId: Number(t.parent),
      count: Number(t.count),
    }));
  }

  async list() {
    // Trae todas las categorías product_cat
    const taxonomies = await this.prisma.wpTermTaxonomy.findMany({
      where: { taxonomy: 'product_cat' },
      include: { term: true },
    });

    // Obtener los IDs que aparecen como parent
    const parentIds = new Set(
      taxonomies.map((t) => Number(t.parent)).filter((parent) => parent !== 0),
    );

    // Filtrar solo categorías que tengan hijos
    const categoriesWithChildren = taxonomies.filter((t) =>
      parentIds.has(Number(t.term_id)),
    );

    return categoriesWithChildren.map((t) => ({
      id: Number(t.term_id),
      name: t.term.name,
      slug: t.term.slug,
      description: t.description,
      parentId: Number(t.parent),
      count: Number(t.count),
    }));
  }

  async findById(id: number) {
    const taxonomy = await this.prisma.wpTermTaxonomy.findFirst({
      where: { term_id: BigInt(id), taxonomy: 'product_cat' },
      include: { term: true },
    });

    if (!taxonomy) throw new NotFoundException('Categoría no encontrada');

    return {
      id: Number(taxonomy.term_id),
      name: taxonomy.term.name,
      slug: taxonomy.term.slug,
      description: taxonomy.description,
      parentId: Number(taxonomy.parent),
    };
  }
}
