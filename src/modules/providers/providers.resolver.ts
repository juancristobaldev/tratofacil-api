// provider-registration.resolver.ts
import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';


import { PrismaService } from 'src/prisma/prisma.service';

import { BankAccount, Provider, UpdateBankInput, UpdateProviderInput } from 'src/graphql/entities/provider.entity';
import { ProviderService } from './providers.service';
import {  ProviderRegistrationInput } from 'src/graphql/entities/register-provider';
import { GraphQLError } from 'graphql/error';
import { JwtService } from '@nestjs/jwt';

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
        const authHeader = context.req.headers['authorization'] || '';
        const token = authHeader.replace('Bearer ', '');
      

        console.log(token)
        if (!token) {
          throw new GraphQLError('UNAUTHORIZED');
        }
      
        let payload: any;
        try {
          payload = this.jwt.verify(token, {
            secret: process.env.JWT_SECRET || 'default_secret',
          });
        } catch (err) {
          throw new GraphQLError('UNAUTHORIZED');
        }
      

        const userId:string = payload.sub; // o como guardaste el id en el token
      
        // ✅ Ahora userId es confiable
        const { identity,  bank } = input;
      
        // Actualizar usuario
        await this.prisma.user.update({
          where: { id: userId },
          data: { phone: identity.phone },
        });
      
        // Crear proveedor con servicios
        const provider = await this.providerService.create(
          userId,
          {
            name: `${identity.firstName} ${identity.lastName}`,
            location: 'Chile',
          },
          
        );

      
        // Guardar datos bancarios
        await this.prisma.bankAccount.create({
          data: {
            providerId:provider?.id,
            bankName: bank.bankName,
            accountNumber: bank.accountNumber,
            accountType: bank.accountType,
          },
        });
      
        return provider;
      }
      @Mutation(() => Provider)
      async updateProvider(
        @Args('updateProviderInput') input: UpdateProviderInput,
      ): Promise<Provider> {
        const provider = await this.prisma.provider.update({
          where: { id: input.providerId },
          data: {
            name: input.name,
            location: input.location,
          },
          include: { bank: true, services: true },
        });
        return {...provider, logoUrl: provider.logoUrl ?? undefined,
          bank: provider.bank ?? undefined,
          services: provider.services,};
      }
    
      // 🔹 Actualizar Bank
      @Mutation(() => BankAccount)
      async updateBank(
        @Args('updateBankInput') input: UpdateBankInput,
      ): Promise<BankAccount> {
        const bank = await this.prisma.bankAccount.update({
          where: { id: input.bankId },
          data: {
            bankName: input.bankName,
            accountNumber: input.accountNumber,
            accountType: input.accountType,
          },
   
        });
        return bank;
      }
}
