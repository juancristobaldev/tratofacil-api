import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateServiceInput,
  UpdateServiceInput,
} from 'src/graphql/entities/service.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca el detalle de una oferta específica (Product) vinculada
   * a un servicio (Category) y un proveedor.
   */
  async findServiceDetail(serviceId: string, providerId: string) {
    const sId = parseInt(serviceId, 10);
    const pId = parseInt(providerId, 10);

    // Buscamos en la tabla Product (wp_posts) la oferta que cumpla ambos criterios
    const product = await this.prisma.product.findFirst({
      where: {
        serviceId: sId,
        // Buscamos el proveedor dentro de los metadatos del post
        postmeta: {
          some: {
            key: 'provider_id',
            value: providerId, // El ID del proveedor se guarda como string en wp_postmeta
          },
        },
      },
      include: {
        service: true,
        postmeta: true,
        // Traemos la info del proveedor para cumplir con la ServiceDetail Entity
        // Nota: En tu schema, el Product tiene una relación directa o vía postmeta con Provider
      },
    });

    if (!product) return null;

    // Extraer el valor de 'has_home_visit' desde el array de metadatos
    const hasHomeVisitMeta = product.postmeta.find(
      (m) => m.key === 'has_home_visit',
    );

    // Buscamos el objeto provider completo para el retorno
    const provider = await this.prisma.provider.findUnique({
      where: { id: pId },
      include: { user: true },
    });

    if (!provider) return null;

    // Retornamos un objeto alineado exactamente con la Entity ServiceDetail
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      commission: product.commission,
      netAmount: product.netAmount,
      hasHomeVisit: hasHomeVisitMeta?.value === 'true',
      provider: provider,
    };
  }

  /**
   * Crear una oferta (Producto en Prisma/WP) vinculada a una categoría (Service en Prisma/WP)
   */
  async create(data: CreateServiceInput) {
    // Conversión de IDs a Number para coherencia con Int en Prisma
    const categoryId = parseInt(data.categoryId, 10);

    // 1. Validar que la categoría/servicio existe en wp_terms
    const serviceCategory = await this.prisma.service.findUnique({
      where: { id: categoryId },
    });

    if (!serviceCategory) {
      throw new NotFoundException(
        `La categoría con ID ${categoryId} no existe`,
      );
    }

    const commission = data.price * 0.1;
    const netAmount = data.price - commission;

    // 2. Crear el Producto (wp_posts) con sus metadatos (wp_postmeta)
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        commission: commission,
        netAmount: netAmount,
        // Relación con la categoría (Service)
        service: {
          connect: { id: categoryId },
        },
        // Persistencia de metadatos en wp_postmeta
        postmeta: {
          create: [
            {
              key: 'provider_id',
              value: data.providerId,
            },
            {
              key: 'has_home_visit',
              value: String(data.hasHomeVisit),
            },
          ],
        },
      },
      include: {
        service: true,
        postmeta: true,
      },
    });
  }

  /**
   * Actualizar un producto/oferta existente
   */
  async update(id: string, data: UpdateServiceInput) {
    const productId = parseInt(id, 10);

    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      throw new NotFoundException('Producto no encontrado');
    }

    const updateData: any = {
      name: data.name,
      description: data.description,
    };

    // Recalcular montos si el precio cambia
    if (data.price !== undefined) {
      updateData.price = data.price;
      updateData.commission = data.price * 0.1;
      updateData.netAmount = data.price * 0.9;
    }

    // Actualizar metadatos si es necesario
    if (data.hasHomeVisit !== undefined) {
      await this.prisma.postMeta.upsert({
        where: {
          // Nota: Esto requiere una lógica de búsqueda por postId y key específica
          // En WP se suele hacer un updateMany o buscar el ID del meta_id
          id:
            (
              await this.prisma.postMeta.findFirst({
                where: { postId: productId, key: 'has_home_visit' },
              })
            )?.id || 0,
        },
        update: { value: String(data.hasHomeVisit) },
        create: {
          postId: productId,
          key: 'has_home_visit',
          value: String(data.hasHomeVisit),
        },
      });
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        service: true,
        postmeta: true,
      },
    });
  }

  /**
   * Eliminar producto y sus metadatos
   */
  async remove(id: string) {
    const productId = parseInt(id, 10);

    // Primero eliminamos los metadatos relacionados para evitar errores de FK
    await this.prisma.postMeta.deleteMany({
      where: { postId: productId },
    });

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  /**
   * Listar todos los productos (ofertas) con sus relaciones
   */
  async findAll() {
    return this.prisma.product.findMany({
      include: {
        service: {
          include: { category: true }, // Trae la categoría padre
        },
        postmeta: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtener un producto específico por su ID (Int)
   */
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        service: true,
        postmeta: true,
      },
    });

    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  /**
   * Buscar productos por el slug de la subcategoría (Service)
   */
  async findByCategory(categorySlug: string) {
    return this.prisma.product.findMany({
      where: {
        service: {
          slug: categorySlug,
        },
      },
      include: {
        service: true,
        postmeta: true,
      },
    });
  }
}
