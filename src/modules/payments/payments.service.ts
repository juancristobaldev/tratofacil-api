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
import { CreateOrderProductInput } from 'src/graphql/entities/order-product.entity';
import { CreateOrderJobInput } from 'src/graphql/entities/order-job.entity';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  // =====================================================
  // 1️⃣ Credenciales Webpay
  // =====================================================
  private readonly commerceCode = process.env.COMMERCE_CODE!;
  private readonly apiKey = process.env.API_KEY!;

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

  async createOrderProductWithPayment(
    userId: number,
    input: CreateOrderProductInput,
  ) {
    // Buscar el producto físico y validar su existencia
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
    });

    if (!product) {
      throw new NotFoundException('El producto seleccionado no existe');
    }

    // Validar disponibilidad de stock
    if (product.stock < input.quantity) {
      throw new BadRequestException(
        'No hay suficiente stock disponible para completar la orden',
      );
    }

    const totalAmount = product.price * input.quantity;

    // --- CÁLCULO DE COMISIÓN ---
    // Rangos:
    // 50.000 - 500.000 -> 10%
    // 500.001 - 1.500.000 -> 5%
    // 1.500.001 - 5.000.000 -> 3%
    let commissionPercentage = 0;

    if (totalAmount >= 50000 && totalAmount <= 500000) {
      commissionPercentage = 0.1;
    } else if (totalAmount > 500000 && totalAmount <= 1500000) {
      commissionPercentage = 0.05;
    } else if (totalAmount > 1500000 && totalAmount <= 5000000) {
      commissionPercentage = 0.03;
    } else if (totalAmount > 5000000) {
      // Opcional: manejar montos superiores a 5M, por defecto mantengo 3% o según lógica de negocio
      commissionPercentage = 0.03;
    }

    const commission = totalAmount * commissionPercentage;

    return this.prisma.$transaction(async (tx) => {
      // 1. Crear la orden de producto vinculada al cliente y proveedor
      const order = await tx.orderProduct.create({
        data: {
          clientId: userId,
          productId: product.id,
          providerId: product.providerId,
          quantity: input.quantity,
          unitPrice: product.price,
          total: totalAmount,
          commission: commission,
          status: OrderStatus.PENDING,
        },
      });

      // 2. Reservar stock: Descontar la cantidad de la orden
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: input.quantity } },
      });

      // 3. Crear el registro de pago inicial
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          provider: PaymentProvider.WEBPAY,
          status: PaymentStatus.INITIATED,
        },
      });

      return { order, payment };
    });
  }

  async createWebpayProductTransaction(
    orderProductId: number,
    returnUrl: string,
  ): Promise<WebpayResponse> {
    // Buscamos la orden de producto con su respectivo pago
    const orderProduct = await this.prisma.orderProduct.findUnique({
      where: { id: orderProductId },
      include: { payment: true },
    });

    // Validaciones de negocio
    if (!orderProduct)
      throw new NotFoundException('Orden de producto no encontrada');
    if (!orderProduct.payment)
      throw new BadRequestException(
        'No existe un registro de pago asociado a esta orden',
      );
    if (
      orderProduct.status === OrderStatus.SUCCESS ||
      orderProduct.status === OrderStatus.COMPLETED
    )
      throw new BadRequestException(
        'Esta orden ya ha sido pagada satisfactoriamente',
      );

    // Generación de identificadores únicos para Transbank
    const buyOrder = `PROD-ORD-${orderProduct.id}-${Date.now()}`;
    const sessionId = `SES-CLI-${orderProduct.clientId}-${Date.now()}`;

    try {
      // Llamada al SDK de Transbank (tbk() debe devolver la instancia de WebpayPlus.Transaction)
      const response = await this.tbk().create(
        buyOrder,
        sessionId,
        orderProduct.total,
        returnUrl,
      );

      // Actualizamos el PaymentProduct con el token recibido (transactionId)
      await this.prisma.paymentProduct.update({
        where: { id: orderProduct.payment.id },
        data: { transactionId: response.token },
      });

      return {
        token: response.token,
        url: response.url,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error al iniciar transacción Webpay para producto: ' + error.message,
      );
    }
  }

  // =====================================================
  // 2️⃣ Confirmar pago Webpay para Productos
  // =====================================================
  async confirmWebpayProductTransaction(token: string) {
    // Buscamos el pago mediante el token de transacción
    const payment = await this.prisma.paymentProduct.findFirst({
      where: { transactionId: token },
      include: {
        orderProduct: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!payment)
      throw new NotFoundException('Transacción de producto no encontrada');

    try {
      // Confirmamos con Transbank
      const commitResponse = await this.tbk().commit(token);

      // Verificamos si la transacción fue autorizada
      const success =
        commitResponse.status === 'AUTHORIZED' &&
        commitResponse.response_code === 0;

      const newPaymentStatus = success
        ? PaymentStatus.CONFIRMED
        : PaymentStatus.FAILED;

      // Si el pago es exitoso, marcamos la orden como SUCCESS (o PROCESSING según tu flujo)
      const newOrderStatus = success ? OrderStatus.PENDING : OrderStatus.FAILED;
      if (!payment || !payment.orderProduct) return;
      // Ejecutamos la actualización en una transacción de base de datos
      return await this.prisma.$transaction(async (tx) => {
        // 1. Actualizar el estado del pago

        await tx.product.update({
          where: { id: payment.orderProduct.productId },
          data: { stock: payment.orderProduct.product.stock - 1 },
        });

        await tx.paymentProduct.update({
          where: { id: payment.id },
          data: { status: newPaymentStatus },
        });

        // 2. Actualizar la orden y retornar los datos completos para el frontend/email
        return tx.orderProduct.update({
          where: { id: payment.orderProductId },
          data: { status: newOrderStatus },
          include: {
            payment: true,
            client: true,
            product: {
              include: {
                images: true,
                provider: true,
              },
            },
          },
        });
      });
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error al confirmar transacción Webpay de producto: ' + error.message,
      );
    }
  }

  // =====================================================
  // 2️⃣ Crear Orden y Pago (Alineado con ServiceProvider)
  // =====================================================
  async createOrderWithPayment(userId: number, input: CreateOrderInput) {
    // Buscamos la oferta específica del proveedor (ServiceProvider)
    const offer = await this.prisma.serviceProvider.findUnique({
      where: { id: input.serviceProviderId },
    });

    if (!offer) throw new NotFoundException('La oferta de servicio no existe');

    const price = offer.price || 0;
    if (price <= 0)
      throw new BadRequestException('La oferta no tiene un precio válido');

    return this.prisma.$transaction(async (tx) => {
      // Creamos la orden vinculada a la oferta
      const order = await tx.order.create({
        data: {
          clientId: userId,
          total: price,
          status: OrderStatus.PROCESSING,
          serviceProviderId: offer.id,
        },
      }); // Creamos el registro de pago inicial
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: price,
          provider: PaymentProvider.WEBPAY,
          status: PaymentStatus.INITIATED,
        },
      });

      console.log('create order with payment', { order, payment });

      return { order, payment };
    });
  }

  // =====================================================
  // 3️⃣ Iniciar Webpay
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
      const response = await this.tbk().create(
        buyOrder,
        sessionId,
        order.total,
        returnUrl,
      );

      console.log('create transaction', { token: response.token });

      const updatedPayment = await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: { transactionId: response.token },
      });

      console.log({ updatedPayment });
      return {
        token: response.token,
        url: response.url,
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

    console.log('confirm transanction', { token, payment });

    if (!payment) throw new NotFoundException('Transacción no encontrada');

    try {
      const commitResponse = await this.tbk().commit(token);

      console.log({ commitResponse });
      const success =
        commitResponse.status === 'AUTHORIZED' &&
        commitResponse.response_code === 0;

      const newPaymentStatus = success
        ? PaymentStatus.CONFIRMED
        : PaymentStatus.FAILED;
      console.log({ newPaymentStatus });

      const newOrderStatus = success ? OrderStatus.PENDING : OrderStatus.FAILED;

      console.log({ newOrderStatus });
      return await this.prisma.$transaction(async (tx) => {
        await tx.payment
          .update({
            where: { id: payment.id },
            data: { status: newPaymentStatus },
          })
          .then((data) => {
            console.log(data);
          });

        return tx.order.update({
          where: { id: payment.orderId },
          data: { status: newOrderStatus },
          include: {
            payment: true,
            client: true,
            serviceProvider: { include: { service: true } },
          },
        });
      });
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error al confirmar transacción Webpay: ' + error.message,
      );
    }
  }

  // =====================================================
  // 5️⃣ Listar Órdenes por Proveedor (Nativo)
  // =====================================================
  async getOrdersByProviderId(providerId: number) {
    // Buscamos órdenes vinculadas a cualquier oferta (ServiceProvider) de este proveedor
    return this.prisma.order.findMany({
      where: {
        serviceProvider: {
          providerId: providerId,
        },
        payment: {
          status: PaymentStatus.CONFIRMED,
        },
      },
      include: {
        client: true,
        payment: true,
        serviceProvider: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrdersProductsByProviderId(providerId: number) {
    // Buscamos órdenes vinculadas a cualquier oferta (ServiceProvider) de este proveedor
    return this.prisma.orderProduct.findMany({
      where: {
        providerId,
        payment: {
          status: PaymentStatus.CONFIRMED,
        },
      },
      include: {
        client: true,
        payment: true,
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateOrderProductStatus(
    orderId: number,
    status: OrderStatus,
    providerId: number,
  ) {
    const order = await this.prisma.orderProduct.findUnique({
      where: { id: orderId },
      include: { product: true, provider: true },
    });

    // Validamos que la orden pertenezca al proveedor que intenta actualizarla
    if (!order || order.productId !== providerId) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta orden',
      );
    }

    return this.prisma.orderProduct.update({
      where: { id: orderId },
      data: { status },
    });
  }
  // =====================================================
  // 6️⃣ Actualizar Estado de la Orden
  // =====================================================
  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
    providerId: number,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { serviceProvider: true },
    });

    // Validamos que la orden pertenezca al proveedor que intenta actualizarla
    if (!order || order.serviceProvider?.providerId !== providerId) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta orden',
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  // =====================================================
  // 2️⃣ Crear Orden de Trabajo y Registro de Pago
  // =====================================================
  async createOrderJobWithPayment(userId: number, input: CreateOrderJobInput) {
    // Buscar el Job (Trabajo esporádico) y validar su existencia
    const job = await this.prisma.job.findUnique({
      where: { id: input.jobId },
    });

    if (!job) {
      throw new NotFoundException(
        'El trabajo esporádico seleccionado no existe',
      );
    }

    // El precio puede venir del input (negociado) o del Job original
    const amountToPay = input.total || job.price || 0;

    if (amountToPay <= 0) {
      throw new BadRequestException('El monto de la orden debe ser mayor a 0');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Crear la orden de trabajo (OrderJob)
      const orderJob = await tx.orderJob.create({
        data: {
          jobId: job.id,
          clientId: userId,
          total: amountToPay,
          status: OrderStatus.PENDING,
        },
      });

      // 2. Crear el registro de pago inicial (PaymentJob)
      const paymentJob = await tx.paymentJob.create({
        data: {
          orderJobId: orderJob.id,
          amount: amountToPay,
          provider: PaymentProvider.WEBPAY,
          status: PaymentStatus.INITIATED,
        },
      });

      return { orderJob, paymentJob };
    });
  }

  // =====================================================
  // 3️⃣ Iniciar Transacción Webpay para Jobs
  // =====================================================
  async createWebpayJobTransaction(
    orderJobId: number,
    returnUrl: string,
  ): Promise<WebpayResponse> {
    const orderJob = await this.prisma.orderJob.findUnique({
      where: { id: orderJobId },
      include: { payment: true },
    });

    if (!orderJob)
      throw new NotFoundException('Orden de trabajo no encontrada');
    if (!orderJob.payment)
      throw new BadRequestException('No existe un registro de pago asociado');

    if (
      orderJob.status === OrderStatus.SUCCESS ||
      orderJob.status === OrderStatus.COMPLETED
    ) {
      throw new BadRequestException('Esta orden de trabajo ya ha sido pagada');
    }

    const buyOrder = `JOB-ORD-${orderJob.id}-${Date.now()}`;
    const sessionId = `SES-JOB-${orderJob.clientId}-${Date.now()}`;

    try {
      const response = await this.tbk().create(
        buyOrder,
        sessionId,
        orderJob.total,
        returnUrl,
      );

      // Actualizamos el PaymentJob con el token de Transbank
      await this.prisma.paymentJob.update({
        where: { id: orderJob.payment.id },
        data: { transactionId: response.token },
      });

      return {
        token: response.token,
        url: response.url,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error al iniciar Webpay para Job: ' + error.message,
      );
    }
  }

  // =====================================================
  // 4️⃣ Confirmar Pago Webpay para Jobs
  // =====================================================
  async confirmWebpayJobTransaction(token: string) {
    const payment = await this.prisma.paymentJob.findFirst({
      where: { transactionId: token },
      include: { orderJob: true },
    });

    if (!payment)
      throw new NotFoundException('Transacción de trabajo no encontrada');

    try {
      const commitResponse = await this.tbk().commit(token);

      const success =
        commitResponse.status === 'AUTHORIZED' &&
        commitResponse.response_code === 0;

      const newPaymentStatus = success
        ? PaymentStatus.CONFIRMED
        : PaymentStatus.FAILED;

      // Al ser un Job (servicio), suele pasar a PROCESSING si se paga con éxito
      const newOrderStatus = success ? OrderStatus.PENDING : OrderStatus.FAILED;

      return await this.prisma.$transaction(async (tx) => {
        // 1. Actualizar estado del pago
        await tx.paymentJob.update({
          where: { id: payment.id },
          data: { status: newPaymentStatus },
        });

        // 2. Actualizar estado de la orden y retornar con relaciones
        return tx.orderJob.update({
          where: { id: payment.orderJobId },
          data: { status: newOrderStatus },
          include: {
            payment: true,
            client: true,
            job: {
              include: {
                provider: true,
              },
            },
          },
        });
      });
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error al confirmar transacción de Job: ' + error.message,
      );
    }
  }

  // =====================================================
  // 5️⃣ Listar Órdenes de Trabajo por Proveedor
  // =====================================================
  async getOrderJobsByProviderId(providerId: number) {
    return this.prisma.orderJob.findMany({
      where: {
        job: {
          providerId: providerId,
        },
        payment: {
          status: PaymentStatus.CONFIRMED,
        },
      },
      include: {
        client: true,
        payment: true,
        job: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =====================================================
  // 6️⃣ Actualizar Estado de la Orden de Trabajo
  // =====================================================
  async updateOrderJobStatus(
    orderId: number,
    status: OrderStatus,
    providerId: number,
  ) {
    const order = await this.prisma.orderJob.findUnique({
      where: { id: orderId },
      include: { job: true },
    });

    // Validamos que el Job de la orden pertenezca al proveedor
    if (!order || order.job?.providerId !== providerId) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta orden de trabajo',
      );
    }

    return this.prisma.orderJob.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
