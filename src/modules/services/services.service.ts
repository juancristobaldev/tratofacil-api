import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateServiceInput,
  UpdateServiceInput,
} from 'src/graphql/entities/service.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * CREAR SERVICIO (Oferta de Proveedor)
   * Vincula a un proveedor con un servicio del catálogo y le asigna precio.
   */
  async create(input: CreateServiceInput, userId: number) {
    // 1. Validar que la subcategoría/servicio base existe en el catálogo
    const serviceBase = await this.prisma.service.findFirst({
      where: {
        name: input.name,
        category: {
          id: input.categoryId,
        },
      },
    });

    if (!serviceBase) {
      throw new NotFoundException(
        'El servicio base seleccionado no existe en el catálogo',
      );
    }

    // 2. Obtener el perfil del proveedor mediante el userId
    const provider = await this.prisma.provider.findUnique({
      where: { userId: userId },
    });

    if (!provider) {
      throw new ForbiddenException(
        'El usuario no tiene un perfil de proveedor activo',
      );
    }

    // 3. Crear la oferta específica (ServiceProvider)
    // Usamos el slug del servicio base + ID proveedor para unicidad
    const offerSlug = `${serviceBase.slug}-${provider.id}`;

    return this.prisma.serviceProvider.create({
      data: {
        providerId: provider.id,
        serviceId: serviceBase.id,
        slug: offerSlug,
        description: input.description ?? serviceBase.description,
        price: input.price,
        hasHomeVisit: input.hasHomeVisit ?? false,
        // commission y netAmount se pueden calcular aquí o vía middleware/logic
        commission: input.price * 0.1, // Ejemplo 10%
        netAmount: input.price * 0.9,
      },
      include: {
        service: true,
        provider: true,
      },
    });
  }

  /**
   * BUSCAR POR CATEGORÍA
   * Obtiene todos los servicios (subcategorías) de un rubro y sus proveedores.
   */
  async findByCategory(categorySlug: string) {
    // 1. Buscar rubro por slug
    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
      include: {
        services: {
          include: {
            serviceProviders: {
              include: { provider: true },
            },
          },
        },
      },
    });

    if (!category) return [];

    // 2. Mapear al formato esperado por la entidad
    return category.services.map((service) => {
      const providers = service.serviceProviders.map((sp) => ({
        ...sp.provider,
        price: sp.price,
        hasHomeVisit: sp.hasHomeVisit,
      }));

      // Calcular precio mínimo para mostrar "Desde $..."
      const prices = service.serviceProviders
        .map((sp) => sp.price)
        .filter((p) => p !== null) as number[];
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

      return {
        id: service.id,
        name: service.name,
        slug: service.slug,
        description: service.description,
        price: minPrice,
        hasHomeVisit: service.serviceProviders.some((sp) => sp.hasHomeVisit),
        providers: providers,
      };
    });
  }

  /**
   * DETALLE DE SERVICIO ESPECÍFICO DE UN PROVEEDOR
   */
  async findServiceDetail(serviceId: number, providerId: number) {
    const offer = await this.prisma.serviceProvider.findFirst({
      where: {
        serviceId: serviceId,
        providerId: providerId,
      },
      include: {
        service: true,
        provider: { include: { user: true } },
      },
    });

    if (!offer) throw new NotFoundException('Oferta de servicio no encontrada');

    return {
      id: offer.id,
      name: offer.service.name,
      description: offer.description,
      price: offer.price,
      hasHomeVisit: offer.hasHomeVisit,
      provider: offer.provider,
      netAmount: offer.netAmount,
      commission: offer.commission,
    };
  }

  /**
   * LISTAR SERVICIOS DE UN PROVEEDOR
   */
  async findByProvider(userId: number) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) throw new NotFoundException('Proveedor no encontrado');

    const offers = await this.prisma.serviceProvider.findMany({
      where: { providerId: provider.id },
      include: {
        service: {
          include: { category: true },
        },
      },
    });

    return offers.map((offer) => ({
      id: offer.id,
      name: offer.service.name,
      description: offer.description,
      price: offer.price,
      categoryId: offer.service.category?.id,
      subCategoryId: offer.service.id,
      hasHomeVisit: offer.hasHomeVisit,
    }));
  }

  /**
   * ACTUALIZAR OFERTA
   */
  async update(
    serviceProviderId: number,
    input: UpdateServiceInput,
    userId: number,
  ) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
    });
    const offer = await this.prisma.serviceProvider.findUnique({
      where: { id: serviceProviderId },
    });

    if (!provider || !offer || offer.providerId !== provider.id) {
      throw new ForbiddenException('No autorizado para modificar esta oferta');
    }

    return this.prisma.serviceProvider.update({
      where: { id: serviceProviderId },
      data: {
        description: input.description,
        price: input.price,
        // Recalcular montos si el precio cambia
        commission: input.price ? input.price * 0.1 : offer.commission,
        netAmount: input.price ? input.price * 0.9 : offer.netAmount,
      },
    });
  }

  /**
   * ELIMINAR OFERTA
   */
  async delete(serviceProviderId: number, userId: number) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
    });
    const offer = await this.prisma.serviceProvider.findUnique({
      where: { id: serviceProviderId },
    });

    if (!provider || !offer || offer.providerId !== provider.id) {
      throw new ForbiddenException('No autorizado');
    }

    return this.prisma.serviceProvider.delete({
      where: { id: serviceProviderId },
    });
  }

  async findAll() {
    return this.prisma.service.findMany({
      include: { category: true },
    });
  }
}
