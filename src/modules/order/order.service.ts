import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear orden (cliente contrata un producto/oferta)
   * Nota: En tu esquema, el precio y la oferta real están en 'Product'.
   */
  async create(clientId: string, productId: string) {
    // Transformación explícita para coherencia con schema.prisma (Int)
    const cId = parseInt(clientId, 10);
    const pId = parseInt(productId, 10);

    const product = await this.prisma.product.findUnique({
      where: { id: pId },
    });

    if (!product) throw new NotFoundException('Producto no encontrado');

    return this.prisma.order.create({
      data: {
        clientId: cId,
        productId: pId,
        total: product.price, // Mantiene coherencia con el precio del post de WP
        status: 'PENDING',
      },
      include: { product: true, client: true },
    });
  }

  /**
   * Obtener orden por id
   */
  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        product: {
          include: {
            service: true, // Incluye la subcategoría/servicio de WordPress
          },
        },
        payment: true,
        client: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }

  /**
   * Listar órdenes de un cliente
   */
  listByClient(clientId: string) {
    return this.prisma.order.findMany({
      where: { clientId: Number(clientId) },
      include: {
        product: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cambiar estado de la orden (uso interno)
   */
  async updateStatus(orderId: string, status: OrderStatus) {
    const orderIdInt = Number(orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderIdInt },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return this.prisma.order.update({
      where: { id: orderIdInt },
      data: { status },
    });
  }
}
