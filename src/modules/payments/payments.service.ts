import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  WebpayPlus,
  Environment,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
} from 'transbank-sdk';

@Injectable()
export class PaymentService {
  private webpay;

  constructor(private readonly prisma: PrismaService) {
    this.webpay = new WebpayPlus.Transaction({
      commerceCode:
        process.env.WEBPAY_COMMERCE_CODE ||
        IntegrationCommerceCodes.WEBPAY_PLUS,
  
      apiKey:
        process.env.WEBPAY_API_KEY ||
        IntegrationApiKeys.WEBPAY,
  
      environment:
        process.env.WEBPAY_ENV === 'PRODUCTION'
          ? Environment.Production
          : Environment.Integration,
    });
  }

  /**
   * Crear transacción Webpay
   */
  async createWebpayTransaction(orderId: string, returnUrl: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Orden no existe');
    }

    const response = await this.webpay.create(
      orderId,
      orderId,
      order.total,
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

    await this.prisma.order.update({
      where: { id: response.buy_order },
      data: { status: 'PAID' },
    });

    return response;
  }
}
