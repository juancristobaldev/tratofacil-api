// juancristobaldev/tratofacil-api/src/modules/admin/admin.resolver.ts

import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/graphql/enums/role.enum';
import { OrderStatus } from 'src/graphql/enums/order-status.enum';
import { AdminService } from './admin.service';

// Entidades existentes
import { User } from 'src/graphql/entities/user.entity';
import { Order } from 'src/graphql/entities/order.entity';
import { Category } from 'src/graphql/entities/category.entity';
import { Service } from 'src/graphql/entities/service.entity';
import { Provider, ProviderReview } from 'src/graphql/entities/provider.entity';

@Resolver()
@UseGuards(JwtAuthGuard)
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

  // ==========================================
  // QUERIES (Lectura)
  // ==========================================

  @Query(() => [User], { name: 'adminUsers' })
  async getUsers() {
    return this.adminService.findAllUsers();
  }

  @Query(() => [Provider], { name: 'adminProviders' })
  async getProviders() {
    return this.adminService.findAllProviders();
  }

  @Query(() => [Order], { name: 'adminOrders' })
  async getOrders() {
    return this.adminService.findAllOrders();
  }

  @Query(() => [Category], { name: 'adminCategories' })
  async getCategories() {
    return this.adminService.findAllCategories();
  }

  @Query(() => [Service], { name: 'adminServices' })
  async getServices() {
    return this.adminService.findAllServices();
  }

  @Query(() => [ProviderReview], { name: 'adminReviews' })
  async getReviews() {
    return this.adminService.findAllReviews();
  }

  // ==========================================
  // MUTATIONS (Creación y Actualización)
  // ==========================================

  @Mutation(() => Order, { name: 'adminUpdateOrderStatus' })
  async updateOrderStatus(
    @Args('id', { type: () => Int }) id: number,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
  ) {
    return this.adminService.updateOrderStatus(id, status);
  }

  @Mutation(() => Category, { name: 'adminCreateCategory' })
  async createCategory(
    @Args('name') name: string,
    @Args('slug') slug: string,
    @Args('description', { nullable: true }) description?: string,
  ) {
    return this.adminService.createCategory({ name, slug, description });
  }

  @Mutation(() => User, { name: 'adminUpdateUserRole' })
  async updateUserRole(
    @Args('id', { type: () => Int }) id: number,
    @Args('role', { type: () => Role }) role: Role,
  ) {
    return this.adminService.updateUser(id, { role });
  }

  @Mutation(() => Boolean, { name: 'adminVerifyCertificate' })
  async verifyCertificate(
    @Args('id', { type: () => Int }) id: number,
    @Args('verified') verified: boolean,
  ) {
    await this.adminService.verifyCertificate(id, verified);
    return true;
  }

  // ==========================================
  // MUTATIONS (Eliminación)
  // ==========================================

  @Mutation(() => Boolean, { name: 'adminDeleteUser' })
  async deleteUser(@Args('id', { type: () => Int }) id: number) {
    return this.adminService.deleteUser(id);
  }

  @Mutation(() => Boolean, { name: 'adminDeleteOrder' })
  async deleteOrder(@Args('id', { type: () => Int }) id: number) {
    return this.adminService.deleteOrder(id);
  }

  @Mutation(() => Boolean, { name: 'adminDeleteCategory' })
  async deleteCategory(@Args('id', { type: () => Int }) id: number) {
    return this.adminService.deleteCategory(id);
  }

  @Mutation(() => Boolean, { name: 'adminDeleteService' })
  async deleteService(@Args('id', { type: () => Int }) id: number) {
    return this.adminService.deleteService(id);
  }

  @Mutation(() => Boolean, { name: 'adminDeleteReview' })
  async deleteReview(@Args('id', { type: () => Int }) id: number) {
    return this.adminService.deleteReview(id);
  }
}
