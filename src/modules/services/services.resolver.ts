import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { ServicesService } from 'src/modules/services/services.service';
import {
  CreateServiceInput,
  Service,
  ServiceDetail,
  UpdateServiceInput,
} from 'src/graphql/entities/service.entity';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Resolver(() => Service)
export class ServicesResolver {
  constructor(private readonly servicesService: ServicesService) {}

  // -------------------- QUERIES --------------------

  @Query(() => [Service], { name: 'services' })
  async findAll() {
    return this.servicesService.findAll();
  }

  @Query(() => Service, { name: 'service' })
  async findOne(
    // Cambiado a Int para coincidir con el schema.prisma
    @Args('id', { type: () => Int }) id: number,
  ) {
    return this.servicesService.findOne(id.toString());
  }

  @Query(() => [Service], { name: 'servicesByCategory' })
  async findByCategory(@Args('categorySlug') categorySlug: string) {
    return this.servicesService.findByCategory(categorySlug);
  }

  @Query(() => ServiceDetail)
  async serviceDetail(
    @Args('serviceId', { type: () => Int }) serviceId: number,
    @Args('providerId', { type: () => Int }) providerId: number,
  ): Promise<ServiceDetail> {
    const service = await this.servicesService.findServiceDetail(
      serviceId.toString(),
      providerId.toString(),
    );

    if (!service) {
      throw new NotFoundException('Servicio no disponible para este proveedor');
    }

    // Mapeo limpio respetando la nulabilidad de la base de datos
    return {
      id: service.id,
      name: service.name,
      description: service.description || '',
      price: service.price ?? 0,
      commission: service.commission ?? 0,
      netAmount: service.netAmount ?? 0,
      hasHomeVisit: service.hasHomeVisit,
      provider: {
        ...service.provider,
        logoUrl: service.provider.logoUrl ?? undefined,
        location: service.provider.location ?? undefined,
        createdAt: service.provider.createdAt ?? undefined,
        updatedAt: service.provider.updatedAt ?? undefined,
      },
    };
  }

  // -------------------- MUTATIONS --------------------

  @Mutation(() => Service)
  @Roles(Role.PROVIDER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createService(@Args('input') input: CreateServiceInput) {
    // El input ya debe contener categoryId y providerId como Strings o Ints según tu DTO
    return this.servicesService.create(input);
  }

  @Mutation(() => Service)
  @Roles(Role.PROVIDER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateService(@Args('input') input: UpdateServiceInput) {
    // Usamos el ID del input, asegurando consistencia
    return this.servicesService.update(input.id.toString(), input);
  }

  @Mutation(() => Service)
  @Roles(Role.PROVIDER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removeService(@Args('id', { type: () => Int }) id: number) {
    return this.servicesService.remove(id.toString());
  }
}
