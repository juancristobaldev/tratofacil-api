import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JobsInstaService } from './jobs-insta.service';

import { WebpayResponse } from 'src/graphql/entities/order.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PaymentService } from '../payments/payments.service';
import {
  CreateOrderJobInput,
  OrderJob,
} from 'src/graphql/entities/order-job.entity';
import {
  CreateJobInput,
  Job,
  UpdateJobInput,
} from 'src/graphql/entities/job.entity';
import { Role } from 'src/graphql/enums/role.enum';
import {
  CreateReviewsJobInput,
  ReviewsJob,
} from 'src/graphql/entities/reviews-job.entity';

@Resolver()
export class JobsInstaResolver {
  constructor(
    private readonly jobsInstaService: JobsInstaService,
    private readonly paymentJobService: PaymentService,
  ) {}

  // =========================================================
  // 1. QUERIES (LECTURA)
  // =========================================================

  @Query(() => [Job], { name: 'jobs' })
  async findAllJobs(
    @Args('skip', { type: () => Int }) skip: number,
    @Args('take', { type: () => Int }) take: number,
  ) {
    return this.jobsInstaService.findAllJobs(skip, take);
  }

  @Query(() => Job, { name: 'job' })
  async findOneJob(@Args('id', { type: () => Int }) id: number) {
    return this.jobsInstaService.findOneJob(id);
  }

  @Query(() => [OrderJob], { name: 'myOrderJobs' })
  @UseGuards(JwtAuthGuard)
  async findMyOrders(@Context() context: any) {
    const userId = context.req.user.id;
    return this.jobsInstaService.createOrder(userId, userId); // O usar un método específico de búsqueda en el service
  }

  // =========================================================
  // 2. MUTATIONS - TRABAJOS (JOBS)
  // =========================================================

  @Mutation(() => Job)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  async createJob(
    @Args('input') createJobInput: CreateJobInput,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;

    console.log({ userId });
    // Asumiendo que el JWT trae el userId
    return this.jobsInstaService.createJob(createJobInput, userId);
  }

  @Mutation(() => Job)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  async updateJob(@Args('input') updateJobInput: UpdateJobInput) {
    return this.jobsInstaService.updateJob(updateJobInput.id, updateJobInput);
  }

  @Mutation(() => Job)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PROVIDER)
  async removeJob(@Args('id', { type: () => Int }) id: number) {
    return this.jobsInstaService.removeJob(id);
  }

  // =========================================================
  // 3. MUTATIONS - FLUJO DE ORDEN Y PAGO (WEBPAY)
  // =========================================================

  @Mutation(() => OrderJob)
  @UseGuards(JwtAuthGuard)
  async createOrderJobWithPayment(
    @Args('input') input: CreateOrderJobInput,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;
    // Utilizamos el PaymentJobService para la lógica transaccional de creación
    const result = await this.paymentJobService.createOrderJobWithPayment(
      userId,
      input,
    );
    return result.orderJob;
  }

  @Mutation(() => WebpayResponse)
  @UseGuards(JwtAuthGuard)
  async initWebpayJob(
    @Args('orderJobId', { type: () => Int }) orderJobId: number,
    @Args('returnUrl') returnUrl: string,
  ) {
    return this.paymentJobService.createWebpayJobTransaction(
      orderJobId,
      returnUrl,
    );
  }

  @Mutation(() => OrderJob)
  async confirmWebpayJob(@Args('token') token: string) {
    return this.paymentJobService.confirmWebpayJobTransaction(token);
  }
  @Query(() => [OrderJob], {
    name: 'getOrderJobsByProvider',
    description:
      'Retorna todas las órdenes de trabajo asociadas a los Jobs de un proveedor específico',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PROVIDER)
  async getOrderJobsByProvider(
    @Args('providerId', { type: () => Int }) providerId: number,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;
    // Validación de seguridad opcional: Verificar que el providerId coincida con el usuario logueado
    // const user = context.req.user;
    // if (user.role !== 'ADMIN' && user.providerId !== providerId) {
    //   throw new ForbiddenException('No tienes permiso para ver estas órdenes');
    // }

    return this.paymentJobService.getOrderJobsByProviderId(userId);
  }
  // =========================================================
  // 4. MUTATIONS - RESEÑAS
  // =========================================================

  @Mutation(() => ReviewsJob)
  @UseGuards(JwtAuthGuard)
  async createReviewJob(
    @Args('input') input: CreateReviewsJobInput,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;
    return this.jobsInstaService.createReview(
      input.jobId,
      userId,
      input.rating,
      input.comment,
    );
  }
}
