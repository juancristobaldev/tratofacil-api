// juancristobaldev/tratofacil-api/src/modules/admin/admin.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/graphql/enums/role.enum';
import { OrderStatus } from 'src/graphql/enums/order-status.enum';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Utilidad interna para eliminar archivos del sistema de archivos.
   * Evita errores si el archivo no existe y protege contra URLs externas.
   */
  private deleteFile(fileUrl: string) {
    if (!fileUrl || fileUrl.startsWith('http')) return;
    try {
      // Asumimos que los archivos se guardan en la carpeta /public del proyecto
      const filePath = join(
        process.cwd(),
        'public',
        fileUrl.replace(/^\//, ''),
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Error al eliminar el archivo físico: ${fileUrl}`, error);
    }
  }

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
    // Verificamos si existe el usuario y su perfil de proveedor para limpiar archivos
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Si es proveedor y tiene logo, lo eliminamos
    if (user.provider?.logoUrl) {
      this.deleteFile(user.provider.logoUrl);
    }

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
    imageUrl?: string; // Campo para la imagen
  }) {
    return this.prisma.category.create({ data });
  }

  async updateCategory(id: number, data: any) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    // Si se sube una imagen nueva, eliminamos la anterior para no dejar basura
    if (
      data.imageUrl &&
      category.imageUrl &&
      data.imageUrl !== category.imageUrl
    ) {
      this.deleteFile(category.imageUrl);
    }

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

    if (!category) throw new NotFoundException('Categoría no encontrada');

    if (category?.services.length) {
      throw new BadRequestException(
        'No se puede eliminar una categoría que tiene servicios asociados',
      );
    }

    // Eliminamos la imagen antes de borrar el registro
    if (category.imageUrl) {
      this.deleteFile(category.imageUrl);
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

  // Implementamos la creación de servicios con soporte de imagen
  async createService(data: {
    name: string;
    slug: string;
    description?: string;
    categoryId?: number;
    imageUrl?: string;
  }) {
    return this.prisma.service.create({ data });
  }

  async updateService(id: number, data: any) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Servicio no encontrado');

    // Limpieza de imagen antigua en actualización
    if (
      data.imageUrl &&
      service['imageUrl'] &&
      data.imageUrl !== service['imageUrl']
    ) {
      this.deleteFile(service['imageUrl']);
    }

    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async deleteService(id: number) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Servicio no encontrado');

    // Eliminación de imagen asociada
    if (service['imageUrl']) {
      this.deleteFile(service['imageUrl']);
    }

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
