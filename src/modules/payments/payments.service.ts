import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateOrderInput,
  WebpayResponse,
} from 'src/graphql/entities/order.entity';
import { OrderStatus, PaymentStatus, PaymentProvider } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. CREAR ORDEN Y PAGO (Atomicidad)
   */
  async createOrderWithPayment(userId: number, input: CreateOrderInput) {
    const productId = Number(input.productId);

    // A. Buscar Producto en wp_posts (ID es BigInt en tu schema)
    const product = await this.prisma.wpPost.findUnique({
      where: { ID: BigInt(productId) },
    });

    if (!product) {
      throw new NotFoundException(
        'El producto/servicio seleccionado no existe',
      );
    }

    // B. Buscar precio en wp_postmeta (meta_key = '_price')
    const priceMeta = await this.prisma.wpPostMeta.findFirst({
      where: {
        post_id: BigInt(productId),
        meta_key: '_price',
      },
    });

    // Validación de precio (Parsing de string a float)
    const price =
      priceMeta && priceMeta.meta_value ? parseFloat(priceMeta.meta_value) : 0;

    if (price <= 0) {
      throw new BadRequestException(
        'El producto no tiene un precio válido asignado',
      );
    }

    // C. Transacción: Crear Orden y Pago
    return this.prisma.$transaction(async (tx) => {
      // 1. Crear Orden
      // NOTA CRÍTICA: Tu modelo Order en schema.prisma NO tiene columna 'productId'.
      // Solo guardamos el total calculado y el cliente.
      const order = await tx.order.create({
        data: {
          clientId: userId,
          total: price,
          status: OrderStatus.PENDING,
          // wcOrderId y wcOrderKey son opcionales y nulos al inicio
        },
      });

      // 2. Crear Pago Inicial
      // Tu modelo Payment SI tiene 'transactionId' (String?), iniciamos en null.
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: price,
          provider: input.paymentProvider || PaymentProvider.WEBPAY,
          status: PaymentStatus.INITIATED,
          transactionId: null,
        },
      });

      // Retornar la orden con sus relaciones disponibles (client y payment)
      return tx.order.findUnique({
        where: { id: order.id },
        include: { payment: true, client: true },
      });
    });
  }

  /**
   * 2. INICIAR WEBPAY (Generar Token)
   */
  async createWebpayTransaction(
    orderId: number,
    returnUrl: string,
  ): Promise<WebpayResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.status === OrderStatus.COMPLETED)
      throw new BadRequestException('Orden ya pagada');
    if (!order.payment)
      throw new BadRequestException(
        'No existe un registro de pago para esta orden',
      );

    // --- MOCK WEBPAY (Aquí iría el SDK real) ---
    // Generamos token simulado
    const token = `tbk_token_${Date.now()}_${orderId}`;
    const url = `${returnUrl}?token_ws=${token}`;
    // -------------------------------------------

    // Guardamos el token en la tabla Payment (Campo transactionId existe en tu schema)
    await this.prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        transactionId: token,
        status: PaymentStatus.INITIATED,
        provider: PaymentProvider.WEBPAY, // Aseguramos el provider
      },
    });

    return { token, url };
  }

  /**
   * 3. CONFIRMAR PAGO (Validar Token)
   */
  async confirmWebpayTransaction(token: string) {
    // Buscar el pago por transactionId (Campo existe en tu schema)
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: token },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Transacción no encontrada o token inválido');
    }

    // --- MOCK CONFIRMACIÓN SDK ---
    const isSuccess = true;
    // ----------------------------

    const newPaymentStatus = isSuccess
      ? PaymentStatus.CONFIRMED
      : PaymentStatus.FAILED;
    const newOrderStatus = isSuccess
      ? OrderStatus.COMPLETED
      : OrderStatus.FAILED;

    // Actualizamos Pago y Orden
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
  }
}
