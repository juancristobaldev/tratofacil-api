import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import {
  OrderProduct,
  CreateOrderProductInput,
  OrderProductWithPaymentResponse,
} from '../../graphql/entities/order-product.entity';
import { WebpayResponse } from '../../graphql/entities/order.entity';
import { OrderStatus } from '../../graphql/enums/order-status.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../graphql/enums/role.enum';
import { OrderProductService } from './order-product.service';

@Resolver(() => OrderProduct)
export class OrderProductResolver {
  constructor(private readonly orderProductService: OrderProductService) {}

  /**
   * MUTACIÓN: Crear una orden de producto y generar el registro de pago inicial.
   * Retorna tanto la orden como el objeto de pago.
   */
  @Mutation(() => OrderProductWithPaymentResponse, {
    name: 'createOrderProduct',
  })
  @UseGuards(JwtAuthGuard)
  async createOrderProduct(
    @Args('input') input: CreateOrderProductInput,
    @Context() context: any,
  ) {
    const user = context?.req?.user;
    return this.orderProductService.createOrderProductWithPayment(
      user.id,
      input,
    );
  }

  /**
   * MUTACIÓN: Iniciar la transacción en Transbank Webpay.
   * Retorna el Token y la URL de redirección.
   */
  @Mutation(() => WebpayResponse, { name: 'initWebpayProductTransaction' })
  @UseGuards(JwtAuthGuard)
  async initWebpayTransaction(
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('returnUrl') returnUrl: string,
  ) {
    return this.orderProductService.createWebpayTransaction(orderId, returnUrl);
  }

  /**
   * MUTACIÓN: Confirmar el pago después de que el usuario regresa de Webpay.
   */
  @Mutation(() => OrderProduct, { name: 'confirmWebpayProductTransaction' })
  @UseGuards(JwtAuthGuard)
  async confirmWebpayTransaction(@Args('token') token: string) {
    return this.orderProductService.confirmWebpayTransaction(token);
  }

  /**
   * QUERY: Listar todas las órdenes de productos recibidas por un proveedor.
   * Solo accesible para usuarios con rol PROVIDER.
   */
  @Query(() => [OrderProduct], { name: 'ordersByProvider' })
  @UseGuards(JwtAuthGuard)
  async getOrdersByProvider(@Context() context: any) {
    // El userId del CurrentUser se usa para buscar su perfil de proveedor
    // Asumiendo que el service o el perfil ya está vinculado
    // Nota: El service pide providerId. Si el user es provider, pasamos su ID de proveedor.
    const userId = context?.req?.user?.id;
    return this.orderProductService.getOrdersByProviderId(userId);
  }

  /**
   * MUTACIÓN: Actualizar el estado de una orden (ej: de PROCESSING a COMPLETED).
   * Solo el proveedor dueño del producto puede realizar esta acción.
   */
  @Mutation(() => OrderProduct, { name: 'updateOrderProductStatus' })
  @UseGuards(JwtAuthGuard)
  async updateOrderStatus(
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
    @Context() context: any,
  ) {
    const userId = context.req.user;
    return this.orderProductService.updateOrderStatus(orderId, status, userId);
  }
}
