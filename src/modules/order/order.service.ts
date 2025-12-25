import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear orden (cliente contrata un servicio)
   */
  async create(
    clientId: string,
    serviceId: string,
  ) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Servicio no existe');
    }

    return this.prisma.order.create({
      data: {
        clientId,
        serviceId,
        total: service.price,
        status: OrderStatus.PENDING,
      },
    });
  }

  /**
   * Obtener orden por id
   */
  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        service: true,
        payment: true,
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
      where: { clientId },
      include: {
        service: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cambiar estado de la orden (uso interno)
   */
  async updateStatus(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
