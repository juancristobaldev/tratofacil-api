import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------- CREAR SERVICIO --------------------
  async create(data: {
    name: string;
    description: string;
    price: number;
    categoryId: string; // este puede ser el slug o nombre
    providerId: string;
    hasHomeVisit: boolean;
  }) {
    const commission = data.price * 0.1;
    const netAmount = data.price - commission;
  
    return this.prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        commission,
        netAmount,
        hasHomeVisit: data.hasHomeVisit,
        provider: { connect: { id: data.providerId } },
        category: {
          connectOrCreate: {
            where: { slug: data.categoryId }, // o name: data.categoryId si usas nombre
            create: { name: data.categoryId, slug: data.categoryId },
          },
        },
      },
      include: {
        category: true,
        provider: true,
      },
    });
  }
  
  // -------------------- ACTUALIZAR SERVICIO --------------------
  async update(
    id: string,
    data: {
      name: string;
      description: string;
      price: number;

      hasHomeVisit: boolean;
    },
  ) {
    const existing = await this.findOne(id); // Verifica si existe
    if(!existing) return null
    const commission = data.price * 0.1;
    const netAmount = data.price - commission;

    return this.prisma.service.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        commission,
        netAmount,
  
        hasHomeVisit: data.hasHomeVisit,
      },
      include: {
        category: true,
        provider: true,
      },
    });
  }

  // -------------------- ELIMINAR SERVICIO --------------------
  async remove(id: string) {
    await this.findOne(id); // Verifica existencia

    return this.prisma.service.delete({
      where: { id },
      include: {
        category: true,
        provider: true,
      },
    });
  }

  // -------------------- CONSULTAS --------------------
  async findAll() {
    return this.prisma.service.findMany({
      include: { category: true, provider: true },
      orderBy: { createdAt: 'desc' },
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

  async findByCategory(categoryId: string) {
    const services = await this.prisma.service.findMany({
      where: {
        OR: [
          { category: { id: categoryId } },
          { category: { name: categoryId } },
        ],
      },
      include: {
        category: true,
        provider: true, // aquí cada provider tiene info, pero también necesitamos precio
      },
      orderBy: { createdAt: "desc" },
    });
  
    // Agrupar por nombre de servicio
    const grouped = services.reduce<Record<string, any>>((acc, service) => {
      if (!acc[service.name]) {
        acc[service.name] = {
          id: service.id,
          name: service.name,
          description: service.description,
          category: service.category,
          providers: service.provider.map((p) => ({
            id: p.id,
            name: p.name,
            location: p.location,
            price: service.price, // precio de ese proveedor para este servicio
          })),
        };
      } else {
        // agregar proveedores sin duplicar
        service.provider.forEach((p) => {
          if (!acc[service.name].providers.find((prov: any) => prov.id === p.id)) {
            acc[service.name].providers.push({
              id: p.id,
              name: p.name,
              location: p.location,
              price: service.price,
            });
          }
        });
      }
      return acc;
    }, {});
  
    return Object.values(grouped);
  }

  async findServiceDetail(
    serviceId: string,
    providerId: string,
  ) {
    return this.prisma.service.findFirst({
      where: {
        id: serviceId,
 
        provider: {
          some: {
            id: providerId,
          },
        },
      },
      include: {
        provider: {
          where: {
            id: providerId,
          },
        },
      },
    });
  }

}
