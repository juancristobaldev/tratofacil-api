import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BankAccount,
  Provider,
  UpdateBankInput,
  UpdateProviderInput,
} from 'src/graphql/entities/provider.entity';
import { ProviderService } from './providers.service';
import { GraphQLError } from 'graphql';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { ProviderRegistrationInput } from 'src/graphql/entities/register-provider';

@Resolver()
export class ProvidersResolver {
  constructor(
    private readonly providerService: ProviderService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Mutation(() => Provider)
  async registerProvider(
    @Args('input') input: ProviderRegistrationInput,
    @Context() context: any,
  ) {
    // 1. Obtener y verificar el Token (Coherencia con ID Int)
    const authHeader = context.req.headers['authorization'] || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) throw new UnauthorizedException('No se proporcionó token');

    let payload: any;
    try {
      payload = this.jwt.verify(token, {
        secret: process.env.JWT_SECRET || 'default_secret',
      });
    } catch (err) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const userId = Number(payload.sub); // Convertir a Number para Prisma (Int)
    const { identity, bank, services } = input;

    // 2. Transacción atómica para coherencia de datos
    return this.prisma.$transaction(async (tx) => {
      // A. Actualizar metadatos en wp_usermeta (Coherencia WordPress)
      await tx.userMeta.upsert({
        where: {
          // Buscamos si ya existe el meta del teléfono para este usuario
          id:
            (
              await tx.userMeta.findFirst({
                where: { userId, key: 'billing_phone' },
              })
            )?.id || 0,
        },
        update: { value: identity.phone },
        create: {
          userId,
          key: 'billing_phone',
          value: identity.phone,
        },
      });

      // B. Crear el Proveedor usando el ProviderService refactorizado
      // Se conecta a los servicios (wp_terms) mediante sus IDs o slugs
      const provider = await tx.provider.create({
        data: {
          userId: userId,
          name:
            input.providerName || `${identity.firstName} ${identity.lastName}`,
          location: 'Chile',
          // Vinculamos las categorías (Services en Prisma)
          services: {
            connect: services.categories.map((slug) => ({ slug })),
          },
        },
      });

      // C. Crear datos bancarios (App Table)
      await tx.bankAccount.create({
        data: {
          providerId: provider.id,
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          accountType: bank.accountType,
        },
      });

      // Retornar con relaciones para cumplir con la Entity
      return tx.provider.findUnique({
        where: { id: provider.id },
        include: { bank: true, services: true, user: true },
      });
    });
  }

  @Mutation(() => Provider)
  async updateProvider(
    @Args('updateProviderInput') input: UpdateProviderInput,
  ): Promise<Provider> {
    const providerId = Number(input.providerId);

    const provider = await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        name: input.name,
        location: input.location,
        logoUrl: input.logoUrl,
      },
      include: { bank: true, services: true, user: true },
    });

    // Coherencia con la Entity: Aseguramos que los null sean compatibles
    return provider as unknown as Provider;
  }

  @Mutation(() => BankAccount)
  async updateBank(
    @Args('updateBankInput') input: UpdateBankInput,
  ): Promise<BankAccount> {
    const bankId = Number(input.bankId);

    return this.prisma.bankAccount.update({
      where: { id: bankId },
      data: {
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountType: input.accountType,
      },
    });
  }
}
