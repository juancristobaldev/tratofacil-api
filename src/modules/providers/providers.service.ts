import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class ProviderService {
  constructor(private readonly prisma: PrismaService) {}

  // provider.service.ts
async createWithServices(
    userId: string,
    providerData: {
      name: string;
      location: string;
    },
    categories: string[],
  ) {
    return this.prisma.$transaction(async prisma => {
      const provider = await prisma.provider.create({
        data: {
          ...providerData,
          userId,
        },
      });
  
      for (const slug of categories) {
        let category = await prisma.category.findUnique({
          where: { slug },
        });
  
        
        if (!category) {
         category = await prisma.category.create({
                data: { slug:`${slug}-${new Date()}`, name:slug },
              });

       
        }
  
        await prisma.service.create({
          data: {
            name: category.name,
            description: '',
            price: 0,
            commission: 0,
            netAmount: 0,
            providerId: provider.id,
            categoryId: category.id,
          },
        });
      }
  
      return prisma.provider.findUnique({
        where: { id: provider.id },
        include: { services: true },
      });
    });
  }
  
  /**
   * Crear proveedor (1–1 con User)
   */
  async create(
    userId: string,
    data: {
      name: string;
      location: string;
      logoUrl?: string;
    },
  ) {
    const exists = await this.prisma.provider.findUnique({
      where: { userId },
    });

    if (exists) {
      throw new ConflictException('El usuario ya tiene un proveedor');
    }

    return this.prisma.provider.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  /**
   * Obtener proveedor por userId
   */
  async findByUser(userId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { userId },
      include: {
        services: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return provider;
  }

  /**
   * Obtener proveedor por id
   */
  async findById(id: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        services: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return provider;
  }

  /**
   * Listar todos los proveedores
   */
  list() {
    return this.prisma.provider.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
