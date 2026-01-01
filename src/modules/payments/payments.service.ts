import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WebpayPlus, Environment } from 'transbank-sdk';
import { PaymentProvider, PaymentStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  private webpay;

  constructor(private readonly prisma: PrismaService) {
    // Configuración de Webpay (Integración por defecto)
    this.webpay = new WebpayPlus.Transaction({
      commerceCode: '597055555532',
      apiKey:
        '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
      environment:
        process.env.WEBPAY_ENV === 'PRODUCTION'
          ? Environment.Production
          : Environment.Integration,
    });
  }

  /**
   * Inicia la transacción en Webpay
   */
  async createTransaction(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { client: true },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');

    const returnUrl = `${process.env.FRONTEND_URL}/checkout/validate`;
    const sessionId = `session-${order.clientId}`;
    const buyOrder = `order-${order.id}`;
    const amount = Math.round(order.total);

    try {
      const response = await this.webpay.create(
        buyOrder,
        sessionId,
        amount,
        returnUrl,
      );

      // Creamos el registro de pago en estado INITIATED
      await this.prisma.payment.upsert({
        where: { orderId: order.id },
        update: {
          transactionId: response.token,
          status: PaymentStatus.INITIATED,
          provider: PaymentProvider.WEBPAY,
        },
        create: {
          orderId: order.id,
          amount: amount,
          provider: PaymentProvider.WEBPAY,
          status: PaymentStatus.INITIATED,
          transactionId: response.token,
        },
      });

      return {
        token: response.token,
        url: response.url,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al contactar con Transbank',
      );
    }
  }

  /**
   * Confirma el pago después de que el usuario vuelve de Webpay
   */
  async confirmTransaction(token: string) {
    try {
      const response = await this.webpay.commit(token);

      const payment = await this.prisma.payment.findFirst({
        where: { transactionId: token },
      });

      if (!payment) throw new NotFoundException('Pago no registrado');

      if (response.response_code === 0) {
        // PAGO EXITOSO
        await this.prisma.$transaction([
          // 1. Actualizar Pago local
          this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.CONFIRMED },
          }),
          // 2. Actualizar Orden local
          this.prisma.order.update({
            where: { id: payment.orderId },
            data: { status: OrderStatus.COMPLETED },
          }),
        ]);

        // 3. Opcional: Notificar a WooCommerce vía API que la orden está pagada
        // Aquí usarías el WordpressService.updateOrder(order.wcOrderId, { status: 'processing' })

        return { success: true, orderId: payment.orderId };
      } else {
        // PAGO FALLIDO / RECHAZADO
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        });
        return { success: false, message: 'Pago rechazado por el banco' };
      }
    } catch (error) {
      throw new InternalServerErrorException('Error al confirmar transacción');
    }
  }
}
