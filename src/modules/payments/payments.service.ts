import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateOrderInput,
  WebpayResponse,
} from 'src/graphql/entities/order.entity';
import { PaymentStatus, PaymentProvider } from '@prisma/client';
import { WebpayPlus, Options, Environment } from 'transbank-sdk';
import { OrderStatus } from 'src/graphql/enums/order-status.enum';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  // =====================================================
  // 1️⃣ Credenciales Webpay
  // =====================================================
  private readonly commerceCode = process.env.COMMERCE_CODE!;
  private readonly apiKey = process.env.API_KEY!;

  private tbk(): any {
    return new WebpayPlus.Transaction(
      new Options(
        this.commerceCode,
        this.apiKey,
        process.env.NODE_ENV === 'PRODUCTION'
          ? Environment.Production
          : Environment.Integration,
      ),
    );
  }

  // =====================================================
  // 2️⃣ Crear Orden y Pago (Alineado con ServiceProvider)
  // =====================================================
  async createOrderWithPayment(userId: number, input: CreateOrderInput) {
    // Buscamos la oferta específica del proveedor (ServiceProvider)
    const offer = await this.prisma.serviceProvider.findUnique({
      where: { id: input.serviceProviderId },
    });

    if (!offer) throw new NotFoundException('La oferta de servicio no existe');

    const price = offer.price || 0;
    if (price <= 0)
      throw new BadRequestException('La oferta no tiene un precio válido');

    return this.prisma.$transaction(async (tx) => {
      // Creamos la orden vinculada a la oferta
      const order = await tx.order.create({
        data: {
          clientId: userId,
          total: price,
          status: OrderStatus.PENDING,
          serviceProviderId: offer.id,
        },
      });

      // Creamos el registro de pago inicial
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: price,
          provider: PaymentProvider.WEBPAY,
          status: PaymentStatus.INITIATED,
        },
      });

      return { order, payment };
    });
  }

  // =====================================================
  // 3️⃣ Iniciar Webpay
  // =====================================================
  async createWebpayTransaction(
    orderId: number,
    returnUrl: string,
  ): Promise<WebpayResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (!order.payment)
      throw new BadRequestException('No existe pago asociado');
    if (order.status === OrderStatus.COMPLETED)
      throw new BadRequestException('Orden ya pagada');

    const buyOrder = `ORDER-${order.id}-${Date.now()}`;
    const sessionId = `SES-${order.clientId}-${Date.now()}`;

    try {
      const response = await this.tbk().create(
        buyOrder,
        sessionId,
        order.total,
        returnUrl,
      );

      await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: { transactionId: response.token },
      });

      return {
        token: response.token,
        url: response.url,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error al iniciar transacción Webpay: ' + error.message,
      );
    }
  }

  // =====================================================
  // 4️⃣ Confirmar pago Webpay
  // =====================================================
  async confirmWebpayTransaction(token: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: token },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException('Transacción no encontrada');

    try {
      const commitResponse = await this.tbk().commit(token);

      const success =
        commitResponse.status === 'AUTHORIZED' &&
        commitResponse.response_code === 0;

      const newPaymentStatus = success
        ? PaymentStatus.CONFIRMED
        : PaymentStatus.FAILED;
      const newOrderStatus = success ? OrderStatus.PENDING : OrderStatus.FAILED;

      return await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: newPaymentStatus },
        });

        return tx.order.update({
          where: { id: payment.orderId },
          data: { status: newOrderStatus },
          include: {
            payment: true,
            client: true,
            serviceProvider: { include: { service: true } },
          },
        });
      });
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error al confirmar transacción Webpay: ' + error.message,
      );
    }
  }

  // =====================================================
  // 5️⃣ Listar Órdenes por Proveedor (Nativo)
  // =====================================================
  async getOrdersByProviderId(providerId: number) {
    // Buscamos órdenes vinculadas a cualquier oferta (ServiceProvider) de este proveedor
    return this.prisma.order.findMany({
      where: {
        serviceProvider: {
          providerId: providerId,
        },
        payment: {
          status: PaymentStatus.CONFIRMED,
        },
      },
      include: {
        client: true,
        payment: true,
        serviceProvider: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =====================================================
  // 6️⃣ Actualizar Estado de la Orden
  // =====================================================
  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
    providerId: number,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { serviceProvider: true },
    });

    // Validamos que la orden pertenezca al proveedor que intenta actualizarla
    if (!order || order.serviceProvider?.providerId !== providerId) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta orden',
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
