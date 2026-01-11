import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProviderPlan } from '@prisma/client'; // ✅ Asegúrate de tener el Enum en Prisma
import {
  CreateProviderInput,
  UpdateProviderInput,
  BankAccountInput,
} from 'src/graphql/entities/provider.entity';
// Importa tus inputs de registro y reseñas según tus archivos
import { CreateReviewInput } from 'src/graphql/entities/provider.entity';

// ✅ 1. CONFIGURACIÓN DE PLANES (Comisiones y Prioridad)
const PLAN_COMMISSIONS = {
  [ProviderPlan.FREE]: 0.25, // 25%
  [ProviderPlan.PREMIUM]: 0.1, // 10%
  [ProviderPlan.FULL]: 0.03, // 3%
};

const PLAN_PRIORITY = {
  [ProviderPlan.FULL]: 3,
  [ProviderPlan.PREMIUM]: 2,
  [ProviderPlan.FREE]: 1,
};

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generador de slug nativo
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * ✅ NUEVO: CAMBIAR PLAN Y RECALCULAR COMISIONES
   * Se llama tras confirmar un pago de suscripción
   */
  async setPlan(providerId: number, plan: ProviderPlan) {
    const planEndsAt =
      plan === ProviderPlan.FREE
        ? null
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    const provider = await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        plan,
        planActive: true,
        planEndsAt,
      },
    });

    // Actualiza las comisiones de todos sus servicios al nuevo porcentaje
    await this.recalculateCommissions(providerId, plan);

    return provider;
  }

  /**
   * ✅ NUEVO: HELPER DE RECALCULO
   */
  private async recalculateCommissions(providerId: number, plan: ProviderPlan) {
    const rate = PLAN_COMMISSIONS[plan];
    const services = await this.prisma.serviceProvider.findMany({
      where: { providerId },
    });

    for (const service of services) {
      if (service.price) {
        const commission = Math.round(service.price * rate);
        const netAmount = service.price - commission;

        await this.prisma.serviceProvider.update({
          where: { id: service.id },
          data: { commission, netAmount },
        });
      }
    }
  }

  /**
   * RESEÑAS
   */
  async createReview(clientId: number, input: CreateReviewInput) {
    const { orderId, providerId, rating, comment } = input;
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.clientId !== clientId) {
      throw new Error('Orden no encontrada o no autorizada');
    }

    return this.prisma.providerReview.create({
      data: { rating, comment, clientId, providerId, orderId },
    });
  }

  /**
   * REGISTRO
   */
  async register(userId: number, input: CreateProviderInput) {
    const { name, company, location, bank, logoUrl } = input;
    const existing = await this.prisma.provider.findUnique({
      where: { userId },
    });

    if (existing)
      throw new BadRequestException('El usuario ya tiene un perfil activo');

    let slug = this.generateSlug(name);
    const slugCheck = await this.prisma.provider.findUnique({
      where: { slug },
    });
    if (slugCheck) slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { displayName: name },
    });

    return this.prisma.provider.create({
      data: {
        userId,
        name: company ?? '',
        slug,
        location: location || 'Chile',
        bio: '',
        logoUrl: logoUrl || '',
        plan: ProviderPlan.FREE, // Por defecto al registrarse
        bank: bank ? { create: { ...bank } } : undefined,
      },
      include: { bank: true, user: true },
    });
  }

  /**
   * ACTUALIZAR PROVEEDOR
   */
  async updateProviderData(id: number, input: UpdateProviderInput) {
    const provider = await this.prisma.provider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('Proveedor no encontrado');

    return this.prisma.provider.update({
      where: { id },
      data: {
        name: input.name,
        location: input.location,
        logoUrl: input.logoUrl,
      },
      include: { bank: true },
    });
  }

  /**
   * ACTUALIZAR BANCO
   */
  async updateBankData(providerId: number, input: BankAccountInput) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: { bank: true },
    });

    if (!provider || !provider.bank) {
      return this.prisma.bankAccount.create({
        data: { ...input, providerId },
      });
    }

    return this.prisma.bankAccount.update({
      where: { id: provider.bank.id },
      data: { ...input },
    });
  }

  /**
   * BÚSQUEDAS
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

  /**
   * ✅ ACTUALIZADO: LISTADO CON PRIORIDAD DE PLAN
   */
  async findAll() {
    const providers = await this.prisma.provider.findMany({
      include: {
        bank: true,
        user: { select: { email: true, displayName: true } },
      },
    });

    // Ordena: FULL primero, luego PREMIUM, luego FREE
    return providers.sort((a, b) => {
      const priorityA = PLAN_PRIORITY[a.plan] || 1;
      const priorityB = PLAN_PRIORITY[b.plan] || 1;
      return priorityB - priorityA;
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
