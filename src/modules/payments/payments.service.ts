import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WebpayPlus, Environment } from 'transbank-sdk';
import { OrderStatus } from '@prisma/client'; // Importamos el Enum nativo de Prisma

@Injectable()
export class PaymentService {
  private webpay;

  constructor(private readonly prisma: PrismaService) {
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
   * Crear transacción Webpay
   */
  async createWebpayTransaction(orderId: number, returnUrl: string) {
    // Alineación: Recibimos number directo, no string
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Orden no existe');
    }

    const amount = order.total ?? 0;
    if (amount <= 0) {
      throw new Error('El monto de la orden debe ser mayor a cero');
    }

    const buyOrder = order.id.toString();
    const sessionId = `SESSION-${order.id}`; // Identificador único de sesión

    const response = await this.webpay.create(
      buyOrder,
      sessionId,
      amount,
      returnUrl,
    );

    return {
      token: response.token,
      url: response.url,
    };
  }

  /**
   * Confirmar transacción Webpay
   */
  async confirmWebpayTransaction(token: string) {
    const response = await this.webpay.commit(token);

    if (response.status !== 'AUTHORIZED') {
      // Podrías marcar la orden como FAILED aquí si quisieras
      throw new Error('Pago no autorizado');
    }

    // ALINEACIÓN: Usamos el Enum OrderStatus correcto
    await this.prisma.order.update({
      where: { id: Number(response.buy_order) },
      data: { status: OrderStatus.COMPLETED }, // 'PAID' no existía
    });

    return response;
  }
}
