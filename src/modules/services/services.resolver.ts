import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service'; // Ruta relativa sugerida: ./services.service
import {
  CreateServiceInput,
  Service,
  ServiceDetail,
  UpdateServiceInput,
} from 'src/graphql/entities/service.entity';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Role } from 'src/graphql/enums/role.enum';

@Resolver(() => Service)
export class ServicesResolver {
  constructor(private readonly servicesService: ServicesService) {}

  // -------------------- QUERIES --------------------

  @Query(() => [Service], { name: 'services' })
  async findAll() {
    return this.servicesService.findAll();
  }

  @Query(() => Service, { name: 'service' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    // El servicio ahora acepta number directamente y maneja el BigInt internamente
    return this.servicesService.findOne(id);
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
      serviceId,
      providerId,
    );

    if (!service) {
      throw new NotFoundException('Servicio no disponible');
    }

    // El servicio ya devuelve la estructura correcta con el Provider incluido
    // Gracias a la lógica en findServiceDetail
    return service;
  }

  // -------------------- MUTATIONS --------------------

  @Mutation(() => Service)
  @Roles(Role.PROVIDER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createService(@Args('input') input: CreateServiceInput) {
    return this.servicesService.create(input);
  }

  @Mutation(() => Service)
  @Roles(Role.PROVIDER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateService(@Args('input') input: UpdateServiceInput) {
    // input.id es Int, el servicio espera number. Todo correcto.
    return this.servicesService.update(input.id, input);
  }

  @Mutation(() => Service)
  @Roles(Role.PROVIDER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removeService(@Args('id', { type: () => Int }) id: number) {
    return this.servicesService.remove(id);
  }
}
