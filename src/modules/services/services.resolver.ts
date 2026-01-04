import { Resolver, Query, Args, Int, Mutation, Context } from '@nestjs/graphql';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import {
  CreateServiceInput,
  Service,
  ServiceByCategory,
  ServiceDetail,
  UpdateServiceInput,
} from 'src/graphql/entities/service.entity';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Resolver(() => Service)
export class ServicesResolver {
  constructor(private readonly servicesService: ServicesService) {}

  @Query(() => [Service], { name: 'servicesByCategory' })
  async findByCategory(
    @Args('categorySlug', { type: () => String }) categorySlug: string,
  ) {
    const services = await this.servicesService.findByCategory(categorySlug);
    if (!services) return [];
    return services;
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Service)
  async createService(
    @Args('input') input: CreateServiceInput,
    @Context() context: any, // provider.user
  ) {
    console.log({
      input,
      userId: context?.req?.user?.id,
    });
    return this.servicesService.create(input, context?.req?.user?.id);
  }

  @Query(() => ServiceDetail, { name: 'serviceDetail' })
  async serviceDetail(
    @Args('serviceId', { type: () => Int }) serviceId: number,
    @Args('providerId', { type: () => Int }) providerId: number,
  ) {
    const detail = await this.servicesService.findServiceDetail(
      serviceId.toString(),
      providerId.toString(),
    );

    if (!detail) {
      throw new NotFoundException('Servicio o proveedor no encontrado');
    }
    return detail;
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Service], { name: 'myServices' })
  async myServices(@Context() ctx: any) {
    const providerId = ctx.req.user.id;
    return this.servicesService.findByProvider(providerId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Service])
  async getServicesProvider(
    @Args('providerId', { type: () => Int }) providerId: number,
  ) {
    return this.servicesService.findByProvider(providerId);
  }

  /* =========================
     CREAR
  ========================= */

  /* =========================
     ACTUALIZAR
  ========================= */

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Service)
  async updateService(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateServiceInput,
    @Context() ctx: any,
  ) {
    return this.servicesService.update(id, input, ctx.req.user.id);
  }

  /* =========================
     ELIMINAR
  ========================= */

  @Query(() => [ServiceByCategory])
  async servicesByCategory(
    @Args('categorySlug') categorySlug: string,
  ): Promise<ServiceByCategory[]> {
    return this.servicesService.findByCategory(categorySlug);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async deleteService(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ) {
    await this.servicesService.delete(id, ctx.req.user.id);
    return true;
  }
}
