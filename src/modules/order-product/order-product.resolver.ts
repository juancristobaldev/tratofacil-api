import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import {
  OrderProduct,
  CreateOrderProductInput,
  OrderProductWithPaymentResponse,
  UpdateShippingInput,
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
    // Se utiliza user.id directamente desde el decorador CurrentUser
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
  @Query(() => [OrderProduct], { name: 'ordersProductsByProvider' })
  @UseGuards(JwtAuthGuard)
  async getOrdersByProvider(@Context() context: any) {
    // Se extrae el provider.id del usuario autenticado para buscar sus órdenes.
    // El servicio espera el ID del proveedor, no del usuario base.
    const user = context?.req?.user?.id;
    return this.orderProductService.getOrdersByProviderId(user);
  }

  /**
   * MUTACIÓN: Actualizar el estado de una orden (ej: de PROCESSING a COMPLETED).
   * Solo el proveedor dueño del producto puede realizar esta acción.
   */

  @Mutation(() => OrderProduct, { name: 'updateOrderProductShipping' })
  @UseGuards(JwtAuthGuard)
  async updateOrderProductShipping(
    @Args('input') input: UpdateShippingInput,
    @Context() context: any,
  ) {
    const userId = context.req.user.id; // Asegúrate de obtener el ID correcto del token

    return this.orderProductService.updateShippingDetails(userId, input);
  }

  @Mutation(() => OrderProduct, { name: 'updateOrderProductStatus' })
  @UseGuards(JwtAuthGuard)
  async updateOrderStatus(
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
    @Context() context: any,
  ) {
    const user = context?.req?.user;

    // Se envía el providerId para q
    // ue el servicio valide que la orden le pertenece.

    return this.orderProductService.updateOrderStatus(orderId, status, user.id);
  }
}
