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

  async createJob(createJobInput: CreateJobInput, userId: number) {
    return this.prisma.job.create({
      data: {
        ...createJobInput,
        provider: {
          connect: {
            userId,
          },
        },
      },
      include: { provider: true },
    });
  }
  async findByProvider(userId: number) {
    return await this.prisma.job.findMany({
      where: {
        provider: {
          userId,
        },
      },
    });
  }
  async findAllJobs(skip: number, take: number) {
    // 1. Obtenemos todos los IDs disponibles (Operación ligera)
    const allIds = await this.prisma.job.findMany({
      select: { id: true },
    });

    // 2. Mezclamos los IDs de forma aleatoria (Algoritmo Fisher-Yates)
    // Nota: Para que la paginación no repita, la mezcla debe ser consistente
    // o mezclar todos y luego aplicar el slice.
    const shuffledIds = allIds
      .map((item) => item.id)
      .sort(() => Math.random() - 0.5); // Mezcla simple

    // 3. Seleccionamos los IDs según la paginación
    const idsToFetch = shuffledIds.slice(skip, skip + take);

    if (idsToFetch.length === 0) return [];

    // 4. Pedimos los datos completos solo para esos IDs
    const jobs = await this.prisma.job.findMany({
      where: {
        id: { in: idsToFetch },
      },
      include: {
        provider: true,
        _count: { select: { orders: true, reviews: true } },
      },
    });

    // 5. Prisma por defecto ordena por ID al usar 'in',
    // re-ordenamos para mantener el orden aleatorio del array idsToFetch
    return idsToFetch.map((id) => jobs.find((job) => job.id === id));
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
