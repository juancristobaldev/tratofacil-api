import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProductInput,
  UpdateProductInput,
} from 'src/graphql/entities/product.entity';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo producto físico
   * Incluye validación de slug único para evitar conflictos en la base de datos.
   */
  async create(data: CreateProductInput) {
    const existing = await this.prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un producto con el slug '${data.slug}'.`,
      );
    }

    return this.prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        specifications: data.specifications,
        price: data.price,
        stock: data.stock,
        imageUrl: data.imageUrl,
        providerId: data.providerId,
        categoryProductId: data.categoryProductId,
      },
      include: {
        provider: true,
        categoryProduct: true,
      },
    });
  }

  /**
   * Listar todos los productos del marketplace
   */
  async findAll() {
    return this.prisma.product.findMany({
      include: {
        provider: true,
        categoryProduct: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Buscar un producto por su ID
   */
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        provider: true,
        categoryProduct: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  /**
   * Buscar un producto por su slug (ideal para la vista de detalle en el frontend)
   */
  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        provider: true,
        categoryProduct: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con slug "${slug}" no encontrado`);
    }

    return product;
  }

  /**
   * Listar productos de un proveedor específico
   */
  async findByProvider(providerId: number) {
    return this.prisma.product.findMany({
      where: { providerId },
      include: { categoryProduct: true },
    });
  }

  /**
   * Listar productos por categoría
   */
  async findByCategory(categoryProductId: number) {
    return this.prisma.product.findMany({
      where: { categoryProductId },
      include: { provider: true },
    });
  }

  /**
   * Actualizar un producto existente
   */
  async update(data: UpdateProductInput) {
    const { id, ...updateData } = data;

    // Validar existencia
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        provider: true,
        categoryProduct: true,
      },
    });
  }

  /**
   * Eliminar un producto
   */
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.product.delete({
      where: { id },
    });
  }

  /**
   * Actualizar el stock de un producto (útil para el flujo de órdenes)
   * @param id ID del producto
   * @param quantity Cantidad a sumar (positiva) o restar (negativa)
   */
  async updateStock(id: number, quantity: number) {
    const product = await this.findOne(id);
    const newStock = product.stock + quantity;

    if (newStock < 0) {
      throw new ConflictException('No hay suficiente stock disponible');
    }

    return this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });
  }
}
