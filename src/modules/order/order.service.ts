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
    // Convertimos IDs a Number ya que en el schema son Int
    const clientIdInt = Number(clientId);
    const productIdInt = Number(productId);

    const product = await this.prisma.product.findUnique({
      where: { id: productIdInt },
    });

    if (!product) {
      throw new NotFoundException('El producto o servicio no existe');
    }

    return this.prisma.order.create({
      data: {
        clientId: clientIdInt,
        productId: productIdInt,
        total: product.price,
        status: OrderStatus.PENDING,
        // createdAt se llena automáticamente por el @default(now()) en el schema
      },
      include: {
        product: true,
      },
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
