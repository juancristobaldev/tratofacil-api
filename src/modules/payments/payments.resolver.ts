import { Resolver, Mutation, Args, Int, Context, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaymentService } from './payments.service';
import {
  Order,
  CreateOrderInput,
  WebpayResponse,
} from 'src/graphql/entities/order.entity';
import { OrderStatus } from 'src/graphql/enums/order-status.enum';

@Resolver()
export class PaymentsResolver {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Crear Orden y Pago (Paso 1)
   */

  @Query(() => [Order])
  getOrdersByProvider(
    @Args('providerId', { type: () => Int }) providerId: number,
  ) {
    return this.paymentService.getOrdersByProviderId(providerId);
  }

  // =========================
  // MUTATION
  // =========================
  @Mutation(() => Order)
  updateOrderStatus(
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
    @Args('providerId', { type: () => Int }) providerId: number,
  ) {
    return this.paymentService.updateOrderStatus(orderId, status, providerId);
  }

  @Mutation(() => Order)
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Args('input') input: CreateOrderInput,
    @Context() context: any,
  ) {
    const userId = Number(context.req.user.id);
    const { order, payment } = await this.paymentService.createOrderWithPayment(
      userId,
      input,
    );
    return order;
  }

  /**
   * Iniciar Webpay (Paso 2)
   */
  @Mutation(() => WebpayResponse)
  @UseGuards(JwtAuthGuard)
  async initiatePayment(
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('returnUrl') returnUrl: string,
  ) {
    return this.paymentService.createWebpayTransaction(orderId, returnUrl);
  }

  /**
   * Confirmar Webpay (Paso 3)
   */
  @Mutation(() => Order)
  async confirmPayment(@Args('token') token: string) {
    return this.paymentService.confirmWebpayTransaction(token);
  }
}
