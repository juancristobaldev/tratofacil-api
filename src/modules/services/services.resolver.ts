import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import {
  CreateServiceInput,
  Service,
  ServiceByCategory,
  ServiceDetail,
  ServiceProvider,
  UpdateServiceInput,
} from 'src/graphql/entities/service.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Resolver(() => Service)
export class ServicesResolver {
  constructor(private readonly servicesService: ServicesService) {}

  /**
   * Obtiene servicios agrupados por categoría (Vía slug)
   */
  @Query(() => [ServiceByCategory], { name: 'servicesByCategory' })
  async findByCategory(
    @Args('categorySlug', { type: () => String }) categorySlug: string,
  ): Promise<ServiceByCategory[]> {
    return this.servicesService.findByCategory(categorySlug);
  }

  /**
   * Crear una oferta de servicio (ServiceProvider)
   */
  @UseGuards(JwtAuthGuard)
  @Mutation(() => ServiceProvider)
  async createService(
    @Args('input') input: CreateServiceInput,
    @Context() context: any,
  ) {
    // Extraemos el sub (ID) del usuario autenticado
    const userId = Number(context.req.user.sub || context.req.user.id);
    return this.servicesService.create(input, userId);
  }

  /**
   * Detalle de un servicio ofrecido por un proveedor específico
   */
  // Cambia la línea 46 del resolver de servicios:
  @Query(() => ServiceDetail, { name: 'serviceDetail' })
  async serviceDetail(
    @Args('serviceId', { type: () => Int }) serviceId: number,
    @Args('providerId', { type: () => Int }) providerId: number,
  ) {
    // ELIMINAMOS los .toString() porque el service ahora espera numbers
    const detail = await this.servicesService.findServiceDetail(
      serviceId,
      providerId,
    );

    if (!detail) {
      throw new NotFoundException('Servicio o proveedor no encontrado');
    }
    return detail;
  }

  /**
   * Servicios ofrecidos por el proveedor logueado
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => [Service], { name: 'myServices' })
  async myServices(@Context() ctx: any) {
    const userId = Number(ctx.req.user.sub || ctx.req.user.id);
    return this.servicesService.findByProvider(userId);
  }

  /**
   * Servicios ofrecidos por un proveedor específico (ID)
   */
  @Query(() => [Service], { name: 'getServicesProvider' })
  async getServicesProvider(
    @Args('providerId', { type: () => Int }) providerId: number,
  ) {
    // Nota: El service findByProvider actualmente está diseñado con userId,
    // pero si necesitas por providerId directo se puede ajustar en el service.
    return this.servicesService.findByProvider(providerId);
  }

  /**
   * Actualizar una oferta de servicio
   */
  @UseGuards(JwtAuthGuard)
  @Mutation(() => ServiceProvider)
  async updateService(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateServiceInput,
    @Context() ctx: any,
  ) {
    const userId = Number(ctx.req.user.sub || ctx.req.user.id);
    return this.servicesService.update(id, input, userId);
  }

  /**
   * Eliminar una oferta de servicio
   */
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async deleteService(
    @Args('id', { type: () => Int }) id: number,
    @Context() ctx: any,
  ) {
    const userId = Number(ctx.req.user.sub || ctx.req.user.id);
    await this.servicesService.delete(id, userId);
    return true;
  }
}
