import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Service, ServiceDetail } from 'src/graphql/entities/service.entity';

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
}
