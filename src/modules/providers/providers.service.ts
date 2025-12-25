import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un servicio ofrecido por un proveedor
   */
  async create(
    providerId: string,
    data: {
      name: string;
      description: string;
      price: number;
      commission: number;
      categoryId: string;
      hasHomeVisit?: boolean;
    },
  ) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new ForbiddenException('Proveedor inválido');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Categoría no existe');
    }

    const netAmount = data.price - data.commission;

    return this.prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        commission: data.commission,
        netAmount,
        hasHomeVisit: data.hasHomeVisit ?? false,
        providerId,
        categoryId: data.categoryId,
      },
    });
  }

  /**
   * Listar servicios por categoría
   */
  listByCategory(categoryId: string) {
    return this.prisma.service.findMany({
      where: { categoryId },
      include: {
        provider: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtener servicio por id
   */
  findById(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: {
        provider: true,
        category: true,
      },
    });
  }

  /**
   * Listar servicios de un proveedor
   */
  listByProvider(providerId: string) {
    return this.prisma.service.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
