import { Resolver, Query, Mutation, Args, ID, Float } from '@nestjs/graphql';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { ServicesService } from 'src/modules/services/services.service';
import { Service, ServiceDetail } from 'src/graphql/entities/service.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => Service)
export class ServicesResolver {
  constructor(private readonly servicesService: ServicesService) {}

  // -------------------- QUERIES --------------------
  @Query(() => [Service], { name: 'services' })
  async findAll() {
    return this.servicesService.findAll();
  }

  @Query(() => Service, { name: 'service' })
  async findOne(@Args('id', { type: () => ID }) id: string) {
    return this.servicesService.findOne(id);
  }

  @Query(() => [Service], { name: 'servicesByCategory' })
  async findByCategory(@Args('categoryId', { type: () => ID }) categoryId: string) {
    return this.servicesService.findByCategory(categoryId);
  }

  // -------------------- MUTATIONS --------------------
  @Mutation(() => Service)
  @Roles(Role.PROVIDER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createService(
    @Args('name') name: string,
    @Args('description') description: string,
    @Args('price', { type: () => Float }) price: number,
    @Args('categoryId') categoryId: string,
    @Args('providerId') providerId: string,
    @Args('hasHomeVisit') hasHomeVisit: boolean,
  ) {

    return this.servicesService.create({
      name,
      description,
      price,
      hasHomeVisit,
      categoryId,
      providerId,
    });
  }

  @Query(() => ServiceDetail)
  async serviceDetail(
    @Args('serviceId', { type: () => ID }) serviceId: string,
    @Args('providerId', { type: () => ID }) providerId: string,
  ): Promise<ServiceDetail> {
    const service = await this.servicesService.findServiceDetail(
      serviceId,
      providerId,
    );

    console.log(service)

    if (!service || service.provider.length === 0) {
      throw new NotFoundException(
        'Servicio no disponible para este proveedor',
      );
    }

    return {
      id: service.id,
      name: service.name,
      description: service.description, 
      price: service.price,
      commission: service.commission,
      netAmount: service.netAmount,
      hasHomeVisit: service.hasHomeVisit,
      provider: {...service.provider[0], logoUrl:"", services:[]}, // ✅ ahora sí coincide
    };
  }

  @Mutation(() => Service)
  @Roles(Role.PROVIDER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateService(
    @Args('id', { type: () => ID }) id: string,
    @Args('name') name: string,
    @Args('description') description: string,
    @Args('price', { type: () => Float }) price: number,
    @Args('hasHomeVisit') hasHomeVisit: boolean,
  ) {


    return this.servicesService.update(id, {
      name,
      description,
      price,
      hasHomeVisit,
    });
  }

  @Mutation(() => Service)
  @Roles(Role.PROVIDER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removeService(@Args('id', { type: () => ID }) id: string) {
    return this.servicesService.remove(id);
  }
}
