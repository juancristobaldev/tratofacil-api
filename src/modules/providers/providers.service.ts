import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProviderPlan } from '@prisma/client'; // ✅ Ensure this Enum exists in your Prisma Schema
import { RegisterProviderInput } from 'src/graphql/entities/register-provider';
import {
  UpdateProviderInput,
  BankAccountInput,
  CreateReviewInput, // Ensure this Input is exported in your provider.entity.ts
} from 'src/graphql/entities/provider.entity';

// ✅ 1. PLAN CONFIGURATION (Commissions and Priority)
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
   * Native slug generator
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD') // Remove accents
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * ✅ NEW: CHANGE PLAN AND RECALCULATE COMMISSIONS
   * Called after confirming a subscription payment
   */
  async setPlan(providerId: number, plan: ProviderPlan) {
    const planEndsAt =
      plan === ProviderPlan.FREE
        ? null
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const provider = await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        plan,
        planActive: true,
        planEndsAt,
      },
    });

    // Update commissions for all services to the new percentage
    await this.recalculateCommissions(providerId, plan);

    return provider;
  }

  /**
   * ✅ NEW: RECALCULATION HELPER
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
   * ✅ NEW: REVIEWS
   */
  async createReview(clientId: number, input: CreateReviewInput) {
    const { orderId, providerId, rating, comment } = input;

    // Validate order ownership
    if (orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!order || order.clientId !== clientId) {
        throw new BadRequestException('Orden no encontrada o no autorizada');
      }
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

  /**
   * PROVIDER REGISTRATION (Native and Atomic Logic)
   * Merged with Plan logic and preserving existing fields (phone, bio).
   */
  async register(userId: number, input: any) {
    // Note: 'input' comes from logic where identity and bank were separated
    const { name, phone, bio, location, bank, logoUrl } = input;

    // 1. Verify if user already has a provider profile
    const existing = await this.prisma.provider.findUnique({
      where: { userId },
    });
    if (existing)
      throw new BadRequestException(
        'El usuario ya tiene un perfil de proveedor activo',
      );

    // 2. Generate Unique Slug
    let slug = this.generateSlug(name);
    const slugCheck = await this.prisma.provider.findUnique({
      where: { slug },
    });
    if (slugCheck) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 3. Update User DisplayName (from new requirements)
    await this.prisma.user.update({
      where: { id: userId },
      data: { displayName: name },
    });

    // 4. Create Provider and Bank in a single transaction
    return this.prisma.provider.create({
      data: {
        userId,
        name: name,
        slug,
        location: location || 'Chile',
        bio: bio || '',
        logoUrl: logoUrl || '',
        plan: ProviderPlan.FREE, // Default plan upon registration
        // Native relation with BankAccount
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
   * UPDATE PROVIDER DATA
   */
  async updateProviderData(id: number, input: UpdateProviderInput) {
    // Verify existence
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
   * UPDATE BANK DATA
   */
  async updateBankData(providerId: number, input: BankAccountInput) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      include: { bank: true },
    });

    if (!provider || !provider.bank) {
      // If no bank, create it
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
   * SEARCH QUERIES
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
   * ✅ UPDATED: LIST WITH PLAN PRIORITY
   */
  async findAll() {
    const providers = await this.prisma.provider.findMany({
      include: {
        bank: true,
        user: { select: { email: true, displayName: true } },
      },
    });

    // Sort: FULL first, then PREMIUM, then FREE
    return providers.sort((a, b) => {
      // @ts-ignore: Assuming plan exists on type Provider if schema is updated
      const priorityA = PLAN_PRIORITY[a.plan] || 1;
      // @ts-ignore
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
