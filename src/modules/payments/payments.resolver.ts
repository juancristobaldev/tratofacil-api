import { Resolver, Mutation, Args, Int, Context } from '@nestjs/graphql';
import {
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentService } from 'src/modules/payments/payments.service';
import { CreateOrderInput, Order } from 'src/graphql/entities/order.entity';
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
   * Crear Orden y Registro de Pago Inicial
   */
  @Mutation(() => Order)
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Args('input') input: CreateOrderInput,
    @Context() context: any,
  ) {
    const userId = Number(context.req.user.sub); // El ID del JWT es el sub (Int)
    const productId = Number(input.productId); // Coherente con Product (wp_posts)

    // 1. Buscar el producto para obtener el precio real
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(
        'El producto/servicio seleccionado no existe',
      );
    }

    if (!product.price) {
      throw new BadRequestException('El producto no tiene un precio definido');
    }

    // 2. Crear orden y pago en una transacción atómica de Prisma
    // Esto asegura que si falla el pago, no se cree la orden y viceversa
    return this.prisma.$transaction(async (tx) => {
      // Crear la orden (ID autoincremental gestionado por MySQL)
      const order = await tx.order.create({
        data: {
          clientId: userId,
          productId: productId,
          total: product.price,
          status: 'PENDING',
        },
        include: { product: true },
      });

      // Crear el registro de pago asociado a la orden recién creada
      await tx.payment.create({
        data: {
          orderId: order.id, // ID numérico generado automáticamente
          amount: product.price ? product.price : 0,
          provider: 'WEBPAY',
          status: 'INITIATED',
        },
      });

      return order;
    });
  }

  /**
   * Iniciar transacción en Webpay
   */
  @Mutation(() => WebpayResponse)
  @UseGuards(JwtAuthGuard)
  async initiatePayment(
    @Args('orderId') orderId: string, // El ID viene como string desde GQL
    @Args('returnUrl') returnUrl: string,
  ) {
    // El service ya gestiona la conversión Number(orderId) según lo que refactorizamos
    return this.paymentService.createWebpayTransaction(orderId, returnUrl);
  }

  /**
   * Confirmar el pago tras el retorno de Webpay
   */
  @Mutation(() => Order)
  async confirmPayment(@Args('token') token: string) {
    // 1. Confirmar con el SDK de Transbank
    const tbResponse = await this.paymentService.confirmWebpayTransaction(
      token,
    );

    // 2. Buscar y devolver la orden actualizada
    // tbResponse.buy_order es el ID que enviamos a Webpay como string, reconvertimos a Number
    const order = await this.prisma.order.findUnique({
      where: { id: Number(tbResponse.buy_order) },
      include: { product: true, payment: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada tras el pago');
    }

    return order;
  }
}
