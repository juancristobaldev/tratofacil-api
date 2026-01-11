import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus, PaymentProvider, OrderStatus } from '@prisma/client';
import { WebpayPlus, Options, Environment } from 'transbank-sdk';
import {
  CreateOrderProductInput,
  UpdateShippingInput,
} from '../../graphql/entities/order-product.entity';
import { WebpayResponse } from '../../graphql/entities/order.entity';
import {
  CreateShippingInfoInput,
  ShippingInfo,
} from 'src/graphql/entities/shipping.entity';

@Injectable()
export class OrderProductService {
  constructor(private prisma: PrismaService) {}

  // =====================================================
  // 1️⃣ Configuración de Transbank (Webpay Plus)
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

  // Método auxiliar para obtener info por ID de orden
  async findByOrderProductId(orderProductId: number) {
    return this.prisma.shippingInfo.findUnique({
      where: { orderProductId },
    });
  }

  // =====================================================
  // 2️⃣ Crear Orden de Producto con Cálculo de Comisión
  // =====================================================
  async createOrderProductWithPayment(
    userId: number,
    input: CreateOrderProductInput,
    shippingInput: CreateShippingInfoInput,
  ) {
    // Buscar el producto físico y validar su existencia
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
    });

    if (!product) {
      throw new NotFoundException('El producto seleccionado no existe');
    }

    // Validar disponibilidad de stock
    if (product.stock < input.quantity) {
      throw new BadRequestException(
        'No hay suficiente stock disponible para completar la orden',
      );
    }

    const totalAmount = product.price * input.quantity;

    // --- CÁLCULO DE COMISIÓN ---
    // Rangos:
    // 50.000 - 500.000 -> 10%
    // 500.001 - 1.500.000 -> 5%
    // 1.500.001 - 5.000.000 -> 3%
    let commissionPercentage = 0;

    if (totalAmount >= 50000 && totalAmount <= 500000) {
      commissionPercentage = 0.1;
    } else if (totalAmount > 500000 && totalAmount <= 1500000) {
      commissionPercentage = 0.05;
    } else if (totalAmount > 1500000 && totalAmount <= 5000000) {
      commissionPercentage = 0.03;
    } else if (totalAmount > 5000000) {
      // Opcional: manejar montos superiores a 5M, por defecto mantengo 3% o según lógica de negocio
      commissionPercentage = 0.03;
    }

    const commission = totalAmount * commissionPercentage;
    const netAmount = totalAmount - commission;

    return this.prisma.$transaction(async (tx) => {
      // 1. Crear la orden de producto vinculada al cliente y proveedor
      const order = await tx.orderProduct.create({
        data: {
          clientId: userId,
          productId: product.id,
          providerId: product.providerId,
          quantity: input.quantity,
          unitPrice: product.price,
          total: totalAmount,
          commission: commission,

          status: OrderStatus.PENDING,
          shippingInfo: {
            create: shippingInput,
          },
        },
      });

      // 2. Reservar stock: Descontar la cantidad de la orden
      /*
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: input.quantity } },
      });
     */

      // 3. Crear el registro de pago inicial
      const payment = await tx.paymentProduct.create({
        data: {
          orderProductId: order.id,
          amount: totalAmount + commission,
          provider: PaymentProvider.WEBPAY,
          status: PaymentStatus.INITIATED,
        },
      });

      return { order, payment };
    });
  }

  // =====================================================
  // 3️⃣ Iniciar Transacción Webpay
  // =====================================================
  async createWebpayTransaction(
    orderId: number,
    returnUrl: string,
  ): Promise<WebpayResponse> {
    const order = await this.prisma.orderProduct.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    console.log(order);

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (!order.payment)
      throw new BadRequestException('No existe pago asociado');
    if (order.status === OrderStatus.COMPLETED)
      throw new BadRequestException('Orden ya pagada');

    const buyOrder = `PROD-ORD-${order.id}-${Date.now()}`;
    const sessionId = `SES-${order.clientId}-${Date.now()}`;

    try {
      const response = await this.tbk().create(
        buyOrder,
        sessionId,
        order.total,
        returnUrl,
      );

      await this.prisma.paymentProduct.update({
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
  // 4️⃣ Confirmar Pago Webpay
  // =====================================================
  async confirmWebpayTransaction(token: string) {
    const payment = await this.prisma.paymentProduct.findFirst({
      where: { transactionId: token },
      include: { orderProduct: true },
    });

    if (!payment || !payment.orderProduct) {
      throw new NotFoundException('Transacción no encontrada');
    }

    try {
      const commitResponse = await this.tbk().commit(token);

      const success =
        commitResponse.status === 'AUTHORIZED' &&
        commitResponse.response_code === 0;

      const newPaymentStatus = success
        ? PaymentStatus.CONFIRMED
        : PaymentStatus.FAILED;
      const newOrderStatus = success
        ? OrderStatus.PROCESSING
        : OrderStatus.FAILED;

      return await this.prisma.$transaction(async (tx) => {
        // SI FALLA EL PAGO: Devolvemos el stock al producto
        if (!success) {
          await tx.product.update({
            where: { id: payment.orderProduct.productId },
            data: { stock: { increment: payment.orderProduct.quantity } },
          });
        }

        await tx.payment.update({
          where: { id: payment.id },
          data: { status: newPaymentStatus },
        });

        return tx.orderProduct.update({
          where: { id: payment.orderProductId },
          data: { status: newOrderStatus },
          include: {
            payment: true,
            client: true,
            product: { include: { provider: true } },
          },
        });
      });
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error al confirmar transacción Webpay: ' + error.message,
      );
    }
  }
  async updateShippingDetails(userId: number, input: UpdateShippingInput) {
    // 1. Buscar la

    const provider = await this.prisma.provider.findFirst({
      where: {
        userId,
      },
    });
    const order = await this.prisma.orderProduct.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Orden #${input.orderId} no encontrada`);
    }

    // 2. Validar que el proveedor sea el dueño de la orden

    if (order.providerId !== provider?.id) {
      throw new UnauthorizedException(
        'No tienes permisos para gestionar esta orden',
      );
    }

    // 3. Actualizar datos y estado
    return this.prisma.orderProduct.update({
      where: { id: input.orderId },
      data: {
        shippingCompany: input.shippingCompany,
        trackingCode: input.trackingCode,
        status: OrderStatus.COMPLETED, // Asumimos que al poner tracking, el estado pasa a ENVIADO/COMPLETADO
      },
      include: {
        product: true,
        client: true,
      },
    });
  }
  // =====================================================
  // 5️⃣ Listar Órdenes por Proveedor
  // =====================================================
  async getOrdersByProviderId(userId: number) {
    return this.prisma.orderProduct.findMany({
      where: {
        provider: {
          userId,
        },
        payment: { status: PaymentStatus.CONFIRMED },
      },
      include: {
        client: true,
        payment: true,
        product: true,
        shippingInfo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =====================================================
  // 6️⃣ Actualizar Estado de la Orden
  // =====================================================
  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
    userId: number,
  ) {
    const order = await this.prisma.orderProduct.findUnique({
      where: { id: orderId },
    });

    const provider = await this.prisma.provider.findFirst({
      where: {
        userId,
      },
    });

    if (!provider) return;
    if (!order || order.providerId !== provider.id) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta orden',
      );
    }

    return this.prisma.orderProduct.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
