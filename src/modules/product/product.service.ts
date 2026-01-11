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
import * as fs from 'fs';
import * as path from 'path';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  private readonly uploadPath = path.join(process.cwd(), 'public', 'images');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Utilidad para eliminar archivos físicos del servidor
   */
  private deletePhysicalFile(url: string) {
    try {
      const fileName = path.basename(url);
      const filePath = path.join(this.uploadPath, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Error al eliminar archivo físico: ${url}`, error);
    }
  }
  async findAllCategoriesProduct() {
    return this.prisma.categoryProduct.findMany();
  }

  /**
   * Crear un nuevo producto físico con múltiples imágenes y condiciones de entrega
   */
  async create(data: CreateProductInput, userId: number) {
    const provider = await this.prisma.provider.findFirst({
      where: { userId },
    });

    if (!provider) {
      throw new NotFoundException(
        'Perfil de proveedor no encontrado para este usuario.',
      );
    }

    const existing = await this.prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un producto con el slug '${data.slug}'.`,
      );
    }

    // Extraemos imageUrls y conditions del input
    const { imageUrls, conditions, ...productData } = data;

    return this.prisma.product.create({
      data: {
        ...productData,
        providerId: provider.id,
        // Creación anidada de imágenes
        images: {
          create: imageUrls?.map((url) => ({ url })) || [],
        },
        // ✅ Creación anidada de condiciones de entrega
        deliveryCondition: {
          create: { ...conditions },
        },
      },
      include: {
        provider: true,
        categoryProduct: true,
        images: true,
        deliveryCondition: true, // Incluimos las condiciones en la respuesta
      },
    });
  }

  /**
   * Listar todos los productos del marketplace
   */
  async findAll(where?: Prisma.ProductWhereInput) {
    return this.prisma.product.findMany({
      ...(where ? { where } : {}),
      include: {
        provider: true,
        categoryProduct: true,
        images: true,
        deliveryCondition: true,
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
        images: true,
        deliveryCondition: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  /**
   * Buscar un producto por su slug
   */
  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        provider: true,
        categoryProduct: true,
        images: true,
        deliveryCondition: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con slug "${slug}" no encontrado`);
    }

    return product;
  }

  /**
   * Actualizar un producto, sus fotos y sus condiciones de entrega
   */
  async update(data: UpdateProductInput) {
    const { id, imageUrls, conditions, ...updateData } = data;

    // 1. Obtener estado actual
    const currentProduct = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true, deliveryCondition: true },
    });

    if (!currentProduct) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    // 2. Limpieza de fotos físicas
    if (imageUrls) {
      const urlsToRemove = currentProduct.images
        .filter((img) => !imageUrls.includes(img.url))
        .map((img) => img.url);

      urlsToRemove.forEach((url) => this.deletePhysicalFile(url));
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        // Gestión de imágenes
        images: imageUrls
          ? {
              deleteMany: {},
              create: imageUrls.map((url) => ({ url })),
            }
          : undefined,
        // ✅ Gestión de condiciones de entrega mediante upsert
        deliveryCondition: conditions
          ? {
              upsert: {
                create: { ...conditions },
                update: { ...conditions },
              },
            }
          : undefined,
      },
      include: {
        provider: true,
        categoryProduct: true,
        images: true,
        deliveryCondition: true,
      },
    });
  }

  /**
   * Eliminar un producto y todos sus recursos asociados
   */
  async remove(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    // Limpiar archivos físicos
    product.images.forEach((img) => this.deletePhysicalFile(img.url));

    return this.prisma.product.delete({
      where: { id },
    });
  }

  /**
   * Actualizar stock
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
