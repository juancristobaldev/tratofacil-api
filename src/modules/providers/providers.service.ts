import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  RegisterProviderInput, // DTO que definimos antes que une User + Provider + Bank
} from 'src/graphql/entities/register-provider';
import {
  UpdateProviderInput,
  BankAccountInput,
  CreateProviderInput,
  CreateReviewInput,
} from 'src/graphql/entities/provider.entity';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generador de slug nativo (sin dependencias externas)
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD') // Quita acentos
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * REGISTRO DE PROVEEDOR (Lógica nativa y atómica)
   * Alineado para guardar nombre y teléfono en la tabla Provider directamente.
   */

  async createReview(clientId: number, input: CreateReviewInput) {
    const { orderId, providerId, rating, comment } = input;

    // Verificamos que la orden pertenezca al cliente y no tenga reseña previa
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.clientId !== clientId) {
      throw new Error('Orden no encontrada o no autorizada');
    }

    return this.prisma.providerReview.create({
      data: {
        rating,
        comment,
        clientId,
        providerId,
        orderId,
      },
    });
  }
  async register(userId: number, input: CreateProviderInput) {
    // Nota: 'input' aquí viene de la lógica donde ya se separó identity y bank
    const { name, company, location, bank, logoUrl } = input;

    // 1. Verificar si el usuario ya tiene un perfil de proveedor
    const existing = await this.prisma.provider.findUnique({
      where: { userId },
    });

    console.log(existing);
    if (existing)
      throw new BadRequestException(
        'El usuario ya tiene un perfil de proveedor activo',
      );

    // 2. Generar Slug único
    let slug = this.generateSlug(name);
    const slugCheck = await this.prisma.provider.findUnique({
      where: { slug },
    });
    if (slugCheck) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        displayName: name,
      },
    });

    // 3. Crear Proveedor y Banco en una sola transacción de Prisma
    return this.prisma.provider.create({
      data: {
        userId,
        name: company ?? '',
        slug,
        location: location || 'Chile',
        bio: '',
        logoUrl: logoUrl || '',
        // Relación nativa con BankAccount
        bank: bank
          ? {
              create: {
                bankName: bank.bankName,
                accountNumber: bank.accountNumber,
                accountType: bank.accountType,
                rut: bank.rut,
                email: bank.email,
              },
            }
          : undefined,
      },
      include: {
        bank: true,
        user: true,
      },
    });
  }

  /**
   * ACTUALIZAR DATOS DEL PROVEEDOR
   */
  async updateProviderData(id: number, input: UpdateProviderInput) {
    // Verificamos existencia
    const provider = await this.prisma.provider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('Proveedor no encontrado');

    return this.prisma.provider.update({
      where: { id },
      data: {
        name: input.name,
        location: input.location,
        logoUrl: input.logoUrl,
        phone: input.phone,
      },
      include: { bank: true },
    });
  }

  /**
   * ACTUALIZAR DATOS BANCARIOS
   */
  async updateBankData(providerId: number, input: BankAccountInput) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: { bank: true },
    });

    if (!provider || !provider.bank) {
      // Si no tiene banco, lo creamos
      return this.prisma.bankAccount.create({
        data: {
          ...input,
          providerId: providerId,
        },
      });
    }

    return this.prisma.bankAccount.update({
      where: { id: provider.bank.id },
      data: {
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountType: input.accountType,
        rut: input.rut,
        email: input.email,
      },
    });
  }

  /**
   * QUERIES DE BÚSQUEDA (Lectura Limpia)
   */
  async findByUserId(userId: number) {
    return this.prisma.provider.findUnique({
      where: { userId },
      include: {
        bank: true,
        services: { include: { service: true } },
        reviews: true,
        certificates: true,
      },
    });
  }

  async findAll() {
    return this.prisma.provider.findMany({
      include: {
        bank: true,
        user: { select: { email: true, displayName: true } },
      },
    });
  }

  async findOne(id: number) {
    const provider = await this.prisma.provider.findUnique({
      where: { id },
      include: {
        bank: true,
        reviews: { include: { client: true } },
        certificates: true,
        services: { include: { service: true } },
      },
    });

    if (!provider) throw new NotFoundException('Proveedor no encontrado');
    return provider;
  }
}
