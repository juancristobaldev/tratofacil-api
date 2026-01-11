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
import {
  CreateOrderProductInput,
  OrderProduct,
} from 'src/graphql/entities/order-product.entity';
import {
  CreatePlanOrderInput,
  PlanOrder,
} from 'src/graphql/entities/plans.entity';

@Resolver()
export class PaymentsResolver {
  constructor(private readonly paymentService: PaymentService) {}

  // SERVICES

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

  // PRODUCTS

  @Query(() => [OrderProduct], { name: 'getOrdersProductByProvider' })
  @UseGuards(JwtAuthGuard)
  getOrdersProductByProvider(
    @Args('providerId', { type: () => Int }) providerId: number,
  ) {
    // Nota: Deberías tener este método en el service para filtrar OrderProduct
    return this.paymentService.getOrdersProductsByProviderId(providerId);
  }

  // =========================
  // MUTATIONS
  // =========================

  /**
   * Crear Orden de Producto y Reserva de Stock
   */
  @Mutation(() => OrderProduct)
  @UseGuards(JwtAuthGuard)
  async createOrderProduct(
    @Args('input') input: CreateOrderProductInput,
    @Context() context: any,
  ) {
    const userId = Number(context.req.user.id);
    const { order } = await this.paymentService.createOrderProductWithPayment(
      userId,
      input,
    );
    return order;
  }

  /**
   * Iniciar Webpay para Producto (Paso 2)
   */
  @Mutation(() => WebpayResponse)
  @UseGuards(JwtAuthGuard)
  async initiateProductPayment(
    @Args('orderProductId', { type: () => Int }) orderProductId: number,
    @Args('returnUrl') returnUrl: string,
  ) {
    return this.paymentService.createWebpayProductTransaction(
      orderProductId,
      returnUrl,
    );
  }

  /**
   * Confirmar Webpay para Producto (Paso 3)
   */
  @Mutation(() => OrderProduct)
  async confirmProductPayment(@Args('token') token: string) {
    return this.paymentService.confirmWebpayProductTransaction(token);
  }

  /**
   * Actualizar Estado de Entrega/Orden de Producto
   */
  @Mutation(() => OrderProduct)
  @UseGuards(JwtAuthGuard)
  updateOrderProductStatus(
    @Args('orderProductId', { type: () => Int }) orderProductId: number,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
    @Args('providerId', { type: () => Int }) providerId: number,
  ) {
    // Lógica para cambiar de PENDING a SHIPPED o COMPLETED
    return this.paymentService.updateOrderProductStatus(
      orderProductId,
      status,
      providerId,
    );
  }

  @Mutation(() => WebpayResponse, {
    description:
      'Inicia el flujo de pago para adquirir un plan (PREMIUM o FULL) con intervalo mensual/anual',
  })
  @UseGuards(JwtAuthGuard)
  async buyPlan(
    @Args('input') input: CreatePlanOrderInput,
    @Args('returnUrl') returnUrl: string,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;

    // 1. Crear la orden y el registro de pago en la DB
    const { planOrder } = await this.paymentService.createPlanOrderWithPayment(
      userId,
      input,
    );

    // 2. Obtener el token y la URL de redirección de Webpay
    return this.paymentService.createWebpayTransactionPlans(
      planOrder.id,
      returnUrl,
    );
  }

  /**
   * MUTACIÓN: Confirmar el pago del plan
   * Se llama cuando el usuario vuelve de la pasarela de pago.
   */
  @Mutation(() => PlanOrder, {
    description:
      'Confirma la transacción de Webpay y activa el plan en el perfil del proveedor',
  })
  async confirmWebPayTransactionPlans(@Args('token') token: string) {
    return this.paymentService.confirmWebPayTransactionPlans(token);
  }
}
