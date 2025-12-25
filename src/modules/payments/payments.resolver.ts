import { Resolver, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PaymentService } from 'src/modules/payments/payments.service';

import { Order } from 'src/graphql/entities/order.entity';

import { PrismaService } from 'src/prisma/prisma.service';
import { WebpayResponse } from 'src/graphql/entities/webpay.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Resolver()
export class PaymentsResolver {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Paso 1: Iniciar el pago
   * Devuelve el token y la URL a la que el frontend debe redirigir al usuario.
   */
  @Mutation(() => WebpayResponse)
  @UseGuards(JwtAuthGuard)
  async initiatePayment(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('returnUrl') returnUrl: string,
  ) {
    return this.paymentService.createWebpayTransaction(orderId, returnUrl);
  }

  /**
   * Paso 2: Confirmar el pago
   * Se llama con el token que Webpay devuelve en la URL de retorno.
   * Devuelve la ORDEN actualizada (con status PAID).
   */
  @Mutation(() => Order)
  async confirmPayment(@Args('token') token: string) {
    // 1. Confirmamos la transacción con Transbank (tu servicio actualiza la Order a PAID internamente)
    const tbResponse = await this.paymentService.confirmWebpayTransaction(token);

    // 2. Buscamos y devolvemos la orden actualizada para que el frontend vea el cambio de estado
    // tbResponse.buy_order es el ID de la orden según tu implementación del servicio
    return this.prisma.order.findUnique({
      where: { id: tbResponse.buy_order },
    });
  }
}