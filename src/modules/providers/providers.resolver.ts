// provider-registration.resolver.ts
import { Resolver, Mutation, Args } from '@nestjs/graphql';


import { PrismaService } from 'src/prisma/prisma.service';

import * as bcrypt from 'bcrypt';
import { Provider } from 'src/graphql/entities/provider.entity';
import { ProviderService } from './providers.service';
import { ProviderRegistrationInput } from 'src/graphql/entities/register-provider';

@Resolver()
export class ProvidersResolver {
    constructor(
        private readonly prisma: PrismaService,
        private readonly providerService: ProviderService,
      ) {}
    
      @Mutation(() => Provider)
      async registerProvider(
        @Args('input') input: ProviderRegistrationInput,
      ) {
        const { credentials, identity, services } = input;
    
        const hashedPassword = await bcrypt.hash(credentials.password, 10);
    
        const user = await this.prisma.user.create({
          data: {
            email: "juancristobal@developer.com",
            password: hashedPassword,
            phone: identity.phone,
            role: 'PROVIDER',
            isEmailVerified: true,
          },
        });
    
        const provider = await this.providerService.createWithServices(
          user.id,
          {
            name: `${identity.firstName} ${identity.lastName}`,
            location: 'Chile',
          },
          services.categories,
        );
    
        return provider;
      }
}
