import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// Importamos todas las entidades necesarias para el tipado estricto
import {
  CreateServiceInput,
  Service,
  ServiceByCategory,
  ServiceProvider,
  UpdateServiceInput,
} from 'src/graphql/entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * CREAR SERVICIO (Oferta de Proveedor)
   */
  async create(
    input: CreateServiceInput,
    userId: number,
  ): Promise<ServiceProvider> {
    // 1. Validar que el servicio base existe en el catálogo por nombre y categoría
    const serviceBase = await this.prisma.service.findFirst({
      where: {
        slug: input.slug,
        category: {
          id: input.categoryId,
        },
      },
    });

    const services = await this.prisma.service.findMany({
      where: {
        category: {
          id: input.categoryId,
        },
      },
    });

    console.log({ services });
    if (!serviceBase) {
      throw new NotFoundException(
        'El servicio base seleccionado no existe en el catálogo',
      );
    }

    // 2. Obtener el perfil del proveedor
    const provider = await this.prisma.provider.findUnique({
      where: { userId: userId },
    });

    if (!provider) {
      throw new ForbiddenException(
        'El usuario no tiene un perfil de proveedor activo',
      );
    }

    // 3. Crear la oferta específica (ServiceProvider)
    const offerSlug = `${serviceBase.slug}-${provider.id}`;

    return this.prisma.serviceProvider.create({
      data: {
        providerId: provider.id,
        serviceId: serviceBase.id,
        slug: offerSlug,
        description: input.description ?? serviceBase.description,
        price: input.price,
        hasHomeVisit: input.hasHomeVisit ?? false,
        commission: input.price * 0.1, // Ejemplo 10%
        netAmount: input.price * 0.9,
      },
      include: {
        service: true,
        provider: true,
      },
    }) as unknown as ServiceProvider;
  }

  /**
   * BUSCAR POR CATEGORÍA
   * Solución al error de asignación de ServiceProvider[]
   */
  async findByCategory(categorySlug: string): Promise<ServiceByCategory[]> {
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

    return category.services.map((service) => {
      // MAPEAMOS CUIDADOSAMENTE PARA SATISFACER LA ENTIDAD ServiceProvider
      const providers: ServiceProvider[] = service.serviceProviders.map(
        (sp) => ({
          id: sp.id,
          serviceId: sp.serviceId,
          providerId: sp.providerId,
          slug: sp.slug,
          description: sp.description,
          price: sp.price,
          commission: sp.commission,
          netAmount: sp.netAmount,
          hasHomeVisit: sp.hasHomeVisit,
          // PASAMOS LAS RELACIONES PARA QUE EL ENTITY NO SE QUEJE
          service: service as any,
          provider: sp.provider as any,
        }),
      );

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
   * DETALLE DE SERVICIO ESPECÍFICO (ServiceProvider)
   */
  async findServiceDetail(
    serviceId: number,
    providerId: number,
  ): Promise<ServiceProvider> {
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

    // Usamos cast para asegurar compatibilidad con la clase ServiceProvider
    return offer as unknown as ServiceProvider;
  }

  /**
   * LISTAR SERVICIOS DE UN PROVEEDOR
   */
  async findByProvider(userId: number): Promise<Service[]> {
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

    // Devolvemos la lista de servicios base enriquecidos para el resolver
    return offers.map((offer) => ({
      ...offer.service,
      id: offer.id, // Mantenemos el ID de la oferta para acciones de edición/borrado
      description: offer.description,
      serviceProviders: [
        {
          id: offer.id,
          price: offer.price,
          hasHomeVisit: offer.hasHomeVisit,
        },
      ],
    })) as unknown as Service[];
  }

  /**
   * ACTUALIZAR OFERTA
   */
  async update(
    serviceProviderId: number,
    input: UpdateServiceInput,
    userId: number,
  ): Promise<ServiceProvider> {
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
        commission: input.price ? input.price * 0.1 : offer.commission,
        netAmount: input.price ? input.price * 0.9 : offer.netAmount,
      },
      include: { service: true, provider: true },
    }) as unknown as ServiceProvider;
  }

  /**
   * ELIMINAR OFERTA
   */
  async delete(serviceProviderId: number, userId: number): Promise<boolean> {
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
    });
    const offer = await this.prisma.serviceProvider.findUnique({
      where: { id: serviceProviderId },
    });

    if (!provider || !offer || offer.providerId !== provider.id) {
      throw new ForbiddenException('No autorizado');
    }

    await this.prisma.serviceProvider.delete({
      where: { id: serviceProviderId },
    });

    return true;
  }

  async findAll(): Promise<Service[]> {
    return this.prisma.service.findMany({
      include: { category: true },
    }) as unknown as Service[];
  }
}
