import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------- CREAR OFERTA (PRODUCTO) --------------------
  async create(data: {
    name: string;
    description: string;
    price: number;
    categoryId: string; // Slug o ID
    providerId: string;
    hasHomeVisit: boolean;
  }) {
    const commission = data.price * 0.1;
    const netAmount = data.price - commission;

    // 1. Buscamos la subcategoría (Modelo Service en Prisma/WordPress)
    let serviceCategory = await this.prisma.service.findFirst({
      where: { slug: data.categoryId },
    });

    if (!serviceCategory && !isNaN(Number(data.categoryId))) {
      serviceCategory = await this.prisma.service.findUnique({
        where: { id: Number(data.categoryId) },
      });
    }

    if (!serviceCategory) {
      throw new NotFoundException('La categoría de servicio no existe.');
    }

    // 2. Creamos el PRODUCTO
    // Eliminamos IDs manuales y fechas ya que el nuevo schema tiene @default
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        commission,
        netAmount,
        // Usamos la relación 'service' mediante 'connect'
        // Prisma prefiere esto sobre 'serviceId' cuando usas ProductCreateInput
        service: {
          connect: { id: serviceCategory.id },
        },
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

  // -------------------- ACTUALIZAR PRODUCTO --------------------
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      hasHomeVisit?: boolean;
    },
  ) {
    const productId = Number(id);
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing) throw new NotFoundException('Producto no encontrado');

    const updateData: any = {
      name: data.name,
      description: data.description,
    };

    if (data.price !== undefined) {
      updateData.price = data.price;
      updateData.commission = data.price * 0.1;
      updateData.netAmount = data.price - updateData.commission;
    }

    // Si hasHomeVisit cambia, actualizamos el meta correspondiente
    if (data.hasHomeVisit !== undefined) {
      await this.prisma.postMeta.updateMany({
        where: { postId: productId, key: 'has_home_visit' },
        data: { value: String(data.hasHomeVisit) },
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

  // -------------------- ELIMINAR --------------------
  async remove(id: string) {
    const productId = Number(id);
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existing) throw new NotFoundException('Producto no encontrado');

    // Nota: Dependiendo de tu MySQL, podrías necesitar borrar postmeta primero
    // si no tienes ON DELETE CASCADE.
    await this.prisma.postMeta.deleteMany({ where: { postId: productId } });

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  // -------------------- CONSULTAS --------------------
  async findAll() {
    return this.prisma.product.findMany({
      include: {
        service: true,
        postmeta: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: Number(id) },
      include: { service: true, postmeta: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async findByCategory(categorySlug: string) {
    const products = await this.prisma.product.findMany({
      where: {
        service: { slug: categorySlug },
      },
      include: {
        service: true,
        postmeta: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => {
      const providerMeta = product.postmeta.find(
        (m) => m.key === 'provider_id',
      );
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.service,
        providerId: providerMeta ? providerMeta.value : null,
      };
    });
  }
}
