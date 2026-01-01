import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceInput } from 'src/graphql/entities/service.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear categoría
   */
  async create(data: CreateServiceInput) {
    const categoryId = parseInt(data.categoryId, 10);
    const commission = data.price * 0.1;
    const netAmount = data.price - commission;

    // Validación de existencia vía Prisma
    const serviceCategory = await this.prisma.service.findUnique({
      where: { id: categoryId },
    });

    if (!serviceCategory) throw new NotFoundException('Categoría no válida');

    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        commission,
        netAmount,
        service: { connect: { id: categoryId } },
        postmeta: {
          create: [
            { key: 'provider_id', value: data.providerId },
            { key: 'has_home_visit', value: String(data.hasHomeVisit) },
          ],
        },
      },
    });
  }

  /**
   * Obtener categoría por slug
   */
  findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
      include: {
        services: true,
      },
    });
  }
}
