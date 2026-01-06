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
import { ServiceProviderOnCity } from 'src/graphql/entities/register-provider';

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
        categoryId: input.categoryId,
      },
    });

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

    const serviceProviderRaw = await this.prisma.serviceProvider.create({
      data: {
        providerId: provider.id,
        serviceId: serviceBase.id,
        slug: offerSlug,
        description: input.description ?? serviceBase.description,
        price: input.price,
        hasHomeVisit: input.hasHomeVisit ?? false,
        commission: input.price * 0.1,
        netAmount: input.price * 0.9,
        // Solo crear si hay city
        cities: input.city
          ? {
              create: {
                city: input.city,
              },
            }
          : undefined,
      },
      include: {
        service: true,
        provider: true,
        cities: true, // Prisma devuelve: ServiceProviderOnCity[]
      },
    });

    // ⚠️ Primer convertimos a unknown
    const serviceProvider = serviceProviderRaw as unknown as ServiceProvider & {
      cities: ServiceProviderOnCity[];
    };

    return serviceProvider;
  }

  /**
   * BUSCAR POR CATEGORÍA
   * Solución al error de asignación de ServiceProvider[]
   */
  async findByCategory(
    categorySlug: string,
    city?: string,
  ): Promise<ServiceByCategory[]> {
    // Buscamos la categoría y sus servicios
    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
      include: {
        services: {
          include: {
            serviceProviders: {
              include: {
                provider: true,
                // 🔹 Incluimos cities solo si city viene definida
                cities: city ? { where: { city } } : true,
              },
            },
          },
        },
      },
    });

    if (!category) return [];

    return category.services.map((service) => {
      // Filtramos los serviceProviders por ciudad si se pasó city
      const filteredProviders = city
        ? service.serviceProviders.filter(
            (sp) => sp.cities && sp.cities.length > 0,
          )
        : service.serviceProviders;

      // Mapeamos a ServiceProvider para la entidad
      const providers: ServiceProvider[] = filteredProviders.map((sp) => ({
        id: sp.id,
        serviceId: sp.serviceId,
        providerId: sp.providerId,
        slug: sp.slug,
        description: sp.description,
        price: sp.price,
        commission: sp.commission,
        netAmount: sp.netAmount,
        hasHomeVisit: sp.hasHomeVisit,
        service: service as any,
        provider: sp.provider as any,
      }));

      const prices = filteredProviders
        .map((sp) => sp.price)
        .filter((p) => p !== null) as number[];
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

      return {
        id: service.id,
        name: service.name,
        slug: service.slug,
        description: service.description,
        price: minPrice,
        hasHomeVisit: filteredProviders.some((sp) => sp.hasHomeVisit),
        providers,
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
        cities: true,
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
          cities: offer.cities,
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
  ): Promise<ServiceProvider & { cities: ServiceProviderOnCity[] }> {
    // 1️⃣ Validar que el proveedor existe
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
    });

    // 2️⃣ Validar que la oferta existe y pertenece al proveedor
    const offer = await this.prisma.serviceProvider.findUnique({
      where: { id: serviceProviderId },
      include: { cities: true }, // incluir ciudades existentes
    });

    if (!provider || !offer || offer.providerId !== provider.id) {
      throw new ForbiddenException('No autorizado para modificar esta oferta');
    }

    // 3️⃣ Actualizar la oferta
    const updatedOffer = await this.prisma.serviceProvider.update({
      where: { id: serviceProviderId },
      data: {
        description: input.description ?? offer.description,
        price: input.price ?? offer.price,
        commission: input.price ? input.price * 0.1 : offer.commission,
        netAmount: input.price ? input.price * 0.9 : offer.netAmount,

        // 4️⃣ Actualizar ciudades si vienen en input
        cities: input.city
          ? {
              deleteMany: {}, // eliminar las relaciones actuales
              create: [{ city: input.city }],
            }
          : undefined,
      },
      include: {
        service: true,
        provider: true,
        cities: true, // incluir relaciones con ciudades
      },
    });

    // 5️⃣ Tipado TS correcto usando unknown
    return updatedOffer as unknown as ServiceProvider & {
      cities: ServiceProviderOnCity[];
    };
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
