// juancristobaldev/tratofacil-api/src/modules/admin/admin.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/graphql/enums/role.enum';
import { OrderStatus } from 'src/graphql/enums/order-status.enum';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // CRUD USUARIOS / CLIENTES / PROVEEDORES
  // ==========================================

  async findAllUsers() {
    return this.prisma.user.findMany({
      include: { provider: true },
      orderBy: { registered: 'desc' },
    });
  }

  async findUsersByRole(role: Role) {
    return this.prisma.user.findMany({
      where: { role },
      include: { provider: role === Role.PROVIDER },
    });
  }

  async updateUser(id: number, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: number) {
    // Primero verificamos si es proveedor para manejar dependencias
    await this.prisma.user.delete({ where: { id } });
    return true;
  }

  // ==========================================
  // CRUD ÓRDENES
  // ==========================================

  async findAllOrders() {
    return this.prisma.order.findMany({
      include: {
        client: true,
        serviceProvider: {
          include: {
            service: true,
            provider: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(id: number, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async deleteOrder(id: number) {
    await this.prisma.order.delete({ where: { id } });
    return true;
  }

  // ==========================================
  // CRUD CATEGORÍAS
  // ==========================================

  async findAllCategories() {
    return this.prisma.category.findMany({
      include: { services: true },
    });
  }

  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: number;
  }) {
    return this.prisma.category.create({ data });
  }

  async updateCategory(id: number, data: any) {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { services: true },
    });

    if (category?.services.length) {
      throw new BadRequestException(
        'No se puede eliminar una categoría que tiene servicios asociados',
      );
    }

    await this.prisma.category.delete({ where: { id } });
    return true;
  }

  // ==========================================
  // CRUD SERVICIOS (Service Entity)
  // ==========================================

  async findAllServices() {
    return this.prisma.service.findMany({
      include: { category: true, serviceProviders: true },
    });
  }

  async updateService(id: number, data: any) {
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async deleteService(id: number) {
    await this.prisma.service.delete({ where: { id } });
    return true;
  }

  // ==========================================
  // GESTIÓN DE RESEÑAS (Reviews)
  // ==========================================

  async findAllReviews() {
    return this.prisma.providerReview.findMany({
      include: {
        client: true,
        order: true,
        provider: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteReview(id: number) {
    await this.prisma.providerReview.delete({ where: { id } });
    return true;
  }

  // ==========================================
  // CRUD PROVEEDORES (Detalles Específicos)
  // ==========================================

  async findAllProviders() {
    return this.prisma.provider.findMany({
      include: {
        user: true,
        bank: true,
        certificates: true,
        services: { include: { service: true } },
      },
    });
  }

  async verifyCertificate(id: number, verified: boolean) {
    return this.prisma.providerCertificate.update({
      where: { id },
      data: { verified },
    });
  }
}
