import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from 'src/graphql/entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear Rubro / Categoría
   * Totalmente nativo, sin dependencias de WordPress
   */
  async create(data: CreateCategoryInput) {
    // Verificar si el slug ya existe para evitar errores de base de datos
    const existing = await this.prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException(
        `La categoría con el slug '${data.slug}' ya existe.`,
      );
    }

    return this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        parentId: data.parentId,
      },
    });
  }

  /**
   * Listar Categorías (Padres e Hijas)
   */
  async list() {
    return this.prisma.category.findMany({
      include: {
        services: true, // Incluye servicios asociados si es necesario
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Listar SOLO subcategorías (las que tienen un padre)
   */
  async listSubcategories() {
    return this.prisma.category.findMany({
      where: {
        parentId: {
          not: null,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Listar SOLO categorías principales (las que no tienen padre)
   */
  async listMainCategories() {
    return this.prisma.category.findMany({
      where: {
        parentId: null,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Buscar por ID
   */
  async findById(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        services: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    return category;
  }

  /**
   * Actualizar Categoría
   */
  async update(id: number, data: UpdateCategoryInput) {
    await this.findById(id); // Validar existencia

    return this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        parentId: data.parentId,
      },
    });
  }

  /**
   * Eliminar Categoría
   */
  async delete(id: number) {
    await this.findById(id);

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
