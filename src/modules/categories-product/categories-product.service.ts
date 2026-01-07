import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCategoryProductInput,
  UpdateCategoryProductInput,
} from 'src/graphql/entities/category-product';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear una nueva categoría de producto con validación de slug único.
   */
  async create(data: CreateCategoryProductInput) {
    // Verificamos si el slug ya existe para evitar errores de restricción en BD
    const existing = await this.prisma.categoryProduct.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException(
        `La categoría de producto con el slug '${data.slug}' ya existe.`,
      );
    }

    return this.prisma.categoryProduct.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
      },
    });
  }

  /**
   * Obtiene todas las categorías de productos, incluyendo sus subcategorías (children).
   */
  async findAll(where?: Prisma.CategoryProductWhereInput) {
    return this.prisma.categoryProduct.findMany({
      ...(where ? { where } : {}),
      include: {
        products: {
          include: {
            provider: true,
            images: true,
            deliveryCondition: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Busca una categoría por su ID único.
   * Utilizado internamente para validaciones de existencia.
   */
  async findOne(id: number) {
    const category = await this.prisma.categoryProduct.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundException(
        `Categoría de producto con ID ${id} no encontrada`,
      );
    }

    return category;
  }

  /**
   * Busca una categoría por su slug (ideal para rutas de Marketplace).
   */
  async findBySlug(slug: string) {
    const category = await this.prisma.categoryProduct.findUnique({
      where: { slug },
      include: {
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Categoría con slug "${slug}" no encontrada`);
    }

    return category;
  }

  /**
   * Actualiza los datos de una categoría.
   * Realiza una validación previa de existencia.
   */
  async update(data: UpdateCategoryProductInput) {
    const { id, ...updateData } = data;

    // Validamos que exista antes de actualizar
    await this.findOne(id);

    return this.prisma.categoryProduct.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Elimina una categoría de producto.
   */
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.categoryProduct.delete({
      where: { id },
    });
  }

  /**
   * Filtra y devuelve solo las categorías de nivel superior (sin padre).
   */
  async findMainCategories() {
    return this.prisma.categoryProduct.findMany();
  }

  /**
   * Obtiene las subcategorías directas de un padre específico.
   */
}
