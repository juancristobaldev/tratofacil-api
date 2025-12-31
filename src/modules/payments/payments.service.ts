import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { WebpayPlus, Environment } from 'transbank-sdk';

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
  /**
   * Crear transacción Webpay
   */
  async createWebpayTransaction(orderId: string, returnUrl: string) {
    const orderIdNum = Number(orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderIdNum },
    });

    if (!order) {
      throw new Error('Orden no existe');
    }

    // SOLUCIÓN AL ERROR ts(2345):
    // Usamos el operador nullish coalescing (??) para asegurar que siempre haya un número.
    // Si el total es null, usamos 0 (o puedes lanzar un error si el total es obligatorio).
    const amount = order.total ?? 0;

    if (amount <= 0) {
      throw new Error('El monto de la orden debe ser mayor a cero');
    }

    const buyOrder = order.id.toString();
    const sessionId = `SESSION-${order.id.toString().slice(0, 8)}`;

    const response = await this.webpay.create(
      buyOrder,
      sessionId,
      amount, // Ahora 'amount' es de tipo 'number' estrictamente
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
      throw new Error('Pago no autorizado');
    }

    // 4. Convertimos el buy_order (string) de vuelta a number para Prisma
    await this.prisma.order.update({
      where: { id: Number(response.buy_order) },
      data: { status: 'PAID' },
    });

    return response;
  }
}
