import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateOrderInput,
  WebpayResponse,
} from 'src/graphql/entities/order.entity';
import { PaymentStatus, PaymentProvider } from '@prisma/client';
import { WebpayPlus, Options, Environment } from 'transbank-sdk';
import { OrderStatus } from 'src/graphql/enums/order-status.enum';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}
  // ===================================
  // ==================
  // 1️⃣ Credenciales Webpay
  // =====================================================
  private readonly commerceCode = process.env.COMMERCE_CODE!;
  private readonly apiKey = process.env.API_KEY!;

  // Método interno para inicializar WebpayPlus
  private tbk(): any {
    return new WebpayPlus.Transaction(
      new Options(
        this.commerceCode,
        this.apiKey,
        process.env.NODE_ENV === 'PRODUCTION'
          ? Environment.Production
          : Environment.Integration,
      ),
    );
  }

  // =====================================================
  // 2️⃣ Crear Orden y Pago
  // =====================================================
  async createOrderWithPayment(userId: number, input: CreateOrderInput) {
    const productId = Number(input.productId);

    const product = await this.prisma.wpPost.findUnique({
      where: { ID: BigInt(productId) },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const priceMeta = await this.prisma.wpPostMeta.findFirst({
      where: { post_id: BigInt(productId), meta_key: '_price' },
    });
    const price = priceMeta?.meta_value ? parseFloat(priceMeta.meta_value) : 0;
    if (price <= 0) throw new BadRequestException('Producto sin precio válido');

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          clientId: userId,
          total: price,
          status: OrderStatus.PENDING,
          productId,
        },
      });

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: price,
          provider: PaymentProvider.WEBPAY,
          status: PaymentStatus.INITIATED,
        },
      });

      return { order, payment };
    });
  }

  // =====================================================
  // 3️⃣ Iniciar Webpay (Token real)
  // =====================================================
  async createWebpayTransaction(
    orderId: number,
    returnUrl: string,
  ): Promise<WebpayResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (!order.payment)
      throw new BadRequestException('No existe pago asociado');
    if (order.status === OrderStatus.COMPLETED)
      throw new BadRequestException('Orden ya pagada');

    const buyOrder = `ORDER-${order.id}-${Date.now()}`;
    const sessionId = `SES-${order.clientId}-${Date.now()}`;

    try {
      // Llamada real al SDK de Webpay
      const response = await this.tbk().create(
        buyOrder,
        sessionId,
        order.total,
        returnUrl,
      );

      // Guardamos el token en Payment
      await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: { transactionId: response.token },
      });

      return {
        token: response.token,
        url: response.url, // <-- Frontend redirige a esta URL
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error al iniciar transacción Webpay: ' + error.message,
      );
    }
  }

  // =====================================================
  // 4️⃣ Confirmar pago Webpay
  // =====================================================
  async confirmWebpayTransaction(token: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: token },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException('Transacción no encontrada');

    try {
      const commitResponse = await this.tbk().commit(token);

      const success =
        commitResponse.status === 'AUTHORIZED' &&
        commitResponse.response_code === 0;
      const newPaymentStatus = success
        ? PaymentStatus.CONFIRMED
        : PaymentStatus.FAILED;
      const newOrderStatus = success ? OrderStatus.PENDING : OrderStatus.FAILED;

      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: newPaymentStatus },
        });

        return tx.order.update({
          where: { id: payment.orderId },
          data: { status: newOrderStatus },
          include: { payment: true, client: true },
        });
      });

      return updatedOrder;
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error al confirmar transacción Webpay: ' + error.message,
      );
    }
  }

  async getOrdersByProviderId(providerId: number) {
    // 1️⃣ Obtener provider
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) return [];

    // 2️⃣ Buscar órdenes cuyo producto pertenezca al provider
    const orders = await this.prisma.order.findMany({
      where: {
        productId: { not: null },
        payment: {
          status: PaymentStatus.CONFIRMED,
        },
      },
      include: {
        client: true,
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log({ provider, orders });

    // 3️⃣ Filtrar por autor del producto (wp_posts.post_author)
    const result = [];

    for (const order of orders) {
      const product = await this.prisma.wpPost.findUnique({
        where: { ID: BigInt(order.productId!) },
      });
      if (!product) continue;

      result.push({
        ...order,
        product: {
          id: Number(product.ID),
          title: product.post_title,
        },
      });
    }

    return result;
  }

  /**
   * Actualizar estado de la orden
   */
  async updateOrderStatus(
    orderId: number,
    status: OrderStatus | any,
    providerId: number,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    console.log({ order });

    if (!order?.productId) throw new ForbiddenException();

    const product = await this.prisma.wpPost.findUnique({
      where: { ID: BigInt(order.productId) },
    });

    console.log({ product });

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    console.log({ provider });

    if (!product || !provider) throw new ForbiddenException();

    console.log({ status });
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
