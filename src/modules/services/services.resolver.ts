import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ServicesService } from 'src/modules/services/services.service';
import { Service } from 'src/graphql/entities/service.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Resolver(() => Service)
export class ServicesResolver {
  constructor(private readonly servicesService: ServicesService) {}

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

  @Mutation(() => Service)
  @Roles(Role.PROVIDER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createService(
    @Args('name') name: string,
    @Args('description') description: string,
    @Args('price') price: number,
    @Args('categoryId') categoryId: string,
    @Args('providerId') providerId: string,
  ) {
    // Cálculo de comisiones (puedes ajustar la lógica según tu negocio)
 
    return this.servicesService.create({
      name,
      description,
      price,
      categoryId,
      providerId,
    });
  }

  @Mutation(() => Service)
  @Roles(Role.PROVIDER, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removeService(@Args('id', { type: () => ID }) id: string) {
    return this.servicesService.remove(id);
  }
}