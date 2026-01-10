import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Ajustar según ubicación
import {
  CreateJobInput,
  UpdateJobInput,
} from 'src/graphql/entities/job.entity';

@Injectable()
export class JobsInstaService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // 1. GESTIÓN DE TRABAJOS (JOBS)
  // =========================================================

  async createJob(createJobInput: CreateJobInput, providerId: number) {
    return this.prisma.job.create({
      data: {
        ...createJobInput,
        providerId,
      },
      include: { provider: true },
    });
  }

  async findAllJobs() {
    return this.prisma.job.findMany({
      include: {
        provider: true,
        _count: { select: { orders: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneJob(id: number) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        provider: true,

        orders: { include: { client: true, payment: true } },
      },
    });
    if (!job) throw new NotFoundException(`Trabajo #${id} no encontrado`);
    return job;
  }

  async updateJob(id: number, updateJobInput: UpdateJobInput) {
    const { id: _, ...data } = updateJobInput;
    return this.prisma.job.update({
      where: { id },
      data,
    });
  }

  async removeJob(id: number) {
    return this.prisma.job.delete({ where: { id } });
  }

  // =========================================================
  // 2. GESTIÓN DE ÓRDENES (ORDER JOBS)
  // =========================================================

  async createOrder(jobId: number, clientId: number, total?: number) {
    const job = await this.findOneJob(jobId);

    return this.prisma.orderJob.create({
      data: {
        jobId,
        clientId,
        total: total || job.price || 0,
        status: 'PENDING',
      },
    });
  }

  async updateOrderStatus(orderId: number, status: any) {
    return this.prisma.orderJob.update({
      where: { id: orderId },
      data: { status },
    });
  }

  // =========================================================
  // 3. GESTIÓN DE RESEÑAS (REVIEWS JOB)
  // =========================================================

  async createReview(
    orderJobId: number,
    clientId: number,
    rating: number,
    comment?: string,
  ) {
    const order = await this.prisma.orderJob.findUnique({
      where: { id: orderJobId },
      include: { job: true },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.clientId !== clientId)
      throw new BadRequestException('No autorizado para reseñar esta orden');

    return this.prisma.reviewsJob.create({
      data: {
        rating,
        comment,
        jobId: order.jobId,
        providerId: order.job.providerId,
        clientId,
      },
    });
  }

  // =========================================================
  // 4. GESTIÓN DE PAGOS (PAYMENT JOB)
  // =========================================================

  async createPayment(
    orderJobId: number,
    amount: number,
    provider: any,
    transactionId?: string,
  ) {
    return this.prisma.paymentJob.create({
      data: {
        orderJobId,
        amount,
        provider,
        transactionId,
        status: 'INITIATED',
      },
    });
  }

  async confirmPayment(orderJobId: number, transactionId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Actualizar pago
      const payment = await tx.paymentJob.update({
        where: { orderJobId },
        data: { status: 'CONFIRMED', transactionId },
      });

      // 2. Actualizar orden a PROCESSING o SUCCESS
      await tx.orderJob.update({
        where: { id: orderJobId },
        data: { status: 'PROCESSING' },
      });

      return payment;
    });
  }
}
