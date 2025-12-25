import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un servicio calculando automáticamente comisión y monto neto
   */

  // ... otros métodos del service

async remove(id: string) {
  // Primero verificamos si el servicio existe usando el método findOne que ya lanza NotFoundException
  await this.findOne(id);

  // Procedemos a la eliminación
  return this.prisma.service.delete({
    where: { id },
    include: {
      category: true,
      provider: true,
    },
  });
}

  async create(data: {
    name: string;
    description: string;
    price: number;
    categoryId: string;
    providerId: string;
  }) {
    // 1. Realizar los cálculos fuera del objeto 'data' inicial
    const commission = data.price * 0.1;
    const netAmount = data.price - commission;

    // 2. Pasar todas las propiedades requeridas por el esquema de Prisma
    return this.prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        commission: commission, // Ahora es una variable local válida
        netAmount: netAmount,     // Ahora es una variable local válida
        categoryId: data.categoryId,
        providerId: data.providerId,
      },
      include: {
        category: true,
        provider: true,
      },
    });
  }
  async findByCategory(categoryId: string) {
    return this.prisma.service.findMany({
      where: {
        categoryId: categoryId,
      },
      include: {
        category: true, // Incluye datos de la categoría
        provider: true, // Incluye datos del proveedor
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
  async findAll() {
    return this.prisma.service.findMany({
      include: { category: true, provider: true },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { category: true, provider: true },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return service;
  }
}