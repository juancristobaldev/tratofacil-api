// juancristobaldev/tratofacil-api/src/modules/admin/admin.resolver.ts

import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/graphql/enums/role.enum';
import { OrderStatus } from 'src/graphql/enums/order-status.enum';
import { AdminService } from './admin.service';

// Importación de Entidades
import { User } from 'src/graphql/entities/user.entity';
import { Order } from 'src/graphql/entities/order.entity';
import { Category } from 'src/graphql/entities/category.entity';
import { Service } from 'src/graphql/entities/service.entity';
import {
  Provider,
  ProviderReview,
  ProviderCertificate,
} from 'src/graphql/entities/provider.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class AdminResolver {
  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  // ==========================================
  // ADMIN QUERIES (Lectura Global)
  // ==========================================
  @Query(() => [ProviderCertificate])
  async getCertificates(
    @Args('sortOrder', { nullable: true, defaultValue: 'desc' })
    sortOrder: 'asc' | 'desc',

    @Args('verified', { nullable: true })
    verified?: boolean,
  ) {
    return this.adminService.getCertificates(sortOrder, verified);
  }

  // ============================
  // QUERY: CERTIFICADO POR ID
  // ============================
  @Query(() => ProviderCertificate)
  async getCertificateById(@Args('id', { type: () => Int }) id: number) {
    return this.adminService.getCertificateById(id);
  }

  // ============================
  // MUTATION: APROBAR
  // ============================
  @Mutation(() => ProviderCertificate)
  async approveCertificate(@Args('id', { type: () => Int }) id: number) {
    return this.adminService.approveCertificate(id);
  }

  // ============================
  // MUTATION: RECHAZAR
  // ============================
  @Mutation(() => ProviderCertificate)
  async rejectCertificate(@Args('id', { type: () => Int }) id: number) {
    return this.adminService.rejectCertificate(id);
  }

  @Query(() => [User], {
    name: 'adminUsers',
    description: 'Obtener todos los usuarios (Clientes y Admins)',
  })
  async getUsers() {
    return this.adminService.findAllUsers();
  }

  @Query(() => [Provider], {
    name: 'adminProviders',
    description: 'Obtener todos los proveedores con sus detalles',
  })
  async getProviders() {
    return this.adminService.findAllProviders();
  }

  @Query(() => [Order], {
    name: 'adminOrders',
    description: 'Listado maestro de todas las órdenes del sistema',
  })
  async getOrders() {
    return this.adminService.findAllOrders();
  }

  @Query(() => [Category], {
    name: 'adminCategories',
    description: 'Listado de todas las categorías',
  })
  async getCategories() {
    return this.adminService.findAllCategories();
  }

  @Query(() => [Service], {
    name: 'adminServices',
    description: 'Listado de servicios base disponibles',
  })
  async getServices() {
    return this.adminService.findAllServices();
  }

  @Query(() => [ProviderReview], {
    name: 'adminReviews',
    description: 'Moderación de todas las reseñas',
  })
  async getReviews() {
    return this.adminService.findAllReviews();
  }

  // ==========================================
  // ADMIN MUTATIONS (Escritura y Gestión)
  // ==========================================

  // --- Gestión de Usuarios ---
  @Mutation(() => User, { name: 'adminUpdateUser' })
  async updateUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('role', { type: () => Role, nullable: true }) role?: Role,
    @Args('status', { type: () => Int, nullable: true }) status?: number,
  ) {
    return this.adminService.updateUser(id, { role, status });
  }

  @Mutation(() => Boolean, { name: 'adminDeleteUser' })
  async deleteUser(@Args('id', { type: () => Int }) id: number) {
    return this.adminService.deleteUser(id);
  }

  // --- Gestión de Órdenes ---
  @Mutation(() => Order, { name: 'adminUpdateOrderStatus' })
  async updateOrderStatus(
    @Args('id', { type: () => Int }) id: number,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
  ) {
    return this.adminService.updateOrderStatus(id, status);
  }

  @Mutation(() => Boolean, { name: 'adminDeleteOrder' })
  async deleteOrder(@Args('id', { type: () => Int }) id: number) {
    return this.adminService.deleteOrder(id);
  }

  // --- Gestión de Categorías ---
  @Mutation(() => Category, { name: 'adminCreateCategory' })
  async createCategory(
    @Args('name') name: string,
    @Args('slug') slug: string,
    @Args('imageUrl', { nullable: true }) imageUrl?: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('parentId', { type: () => Int, nullable: true }) parentId?: number,
  ) {
    return this.adminService.createCategory({
      name,
      slug,
      imageUrl,
      description,
      parentId,
    });
  }

  @Mutation(() => Category, { name: 'adminUpdateCategory' })
  async updateCategory(
    @Args('id', { type: () => Int }) id: number,
    @Args('name', { nullable: true }) name?: string,
    @Args('slug', { nullable: true }) slug?: string,
    @Args('imageUrl', { nullable: true }) imageUrl?: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('parentId', { type: () => Int, nullable: true }) parentId?: number,
  ) {
    return this.adminService.updateCategory(id, {
      name,
      slug,
      imageUrl,
      description,
      parentId,
    });
  }

  @Mutation(() => Boolean, { name: 'adminDeleteCategory' })
  async deleteCategory(@Args('id', { type: () => Int }) id: number) {
    return this.adminService.deleteCategory(id);
  }

  // --- Gestión de Servicios ---
  @Mutation(() => Service, { name: 'adminCreateService' })
  async createService(
    @Args('name') name: string,
    @Args('slug') slug: string,
    @Args('imageUrl', { nullable: true }) imageUrl?: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('categoryId', { type: () => Int, nullable: true })
    categoryId?: number,
  ) {
    return this.adminService.createService({
      name,
      slug,
      imageUrl,
      description,
      categoryId,
    });
  }

  @Mutation(() => Service, { name: 'adminUpdateService' })
  async updateService(
    @Args('id', { type: () => Int }) id: number,
    @Args('name', { nullable: true }) name?: string,
    @Args('slug', { nullable: true }) slug?: string,
    @Args('imageUrl', { nullable: true }) imageUrl?: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('categoryId', { type: () => Int, nullable: true })
    categoryId?: number,
  ) {
    return this.adminService.updateService(id, {
      name,
      slug,
      imageUrl,
      description,
      categoryId,
    });
  }

  @Mutation(() => Boolean, { name: 'adminDeleteService' })
  async deleteService(@Args('id', { type: () => Int }) id: number) {
    return this.adminService.deleteService(id);
  }

  // --- Gestión de Reseñas y Certificados ---
  @Mutation(() => Boolean, { name: 'adminDeleteReview' })
  async deleteReview(@Args('id', { type: () => Int }) id: number) {
    return this.adminService.deleteReview(id);
  }

  @Mutation(() => ProviderCertificate, { name: 'adminVerifyCertificate' })
  async verifyCertificate(
    @Args('id', { type: () => Int }) id: number,
    @Args('verified') verified: boolean,
  ) {
    return this.adminService.verifyCertificate(id, verified);
  }
}
