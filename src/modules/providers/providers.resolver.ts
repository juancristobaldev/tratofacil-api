import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  ResolveField,
  Parent,
  Int,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

// Services
import { ProvidersService } from './providers.service';
import { UserService } from '../users/users.service';

// Entities & Inputs
import {
  Provider,
  BankAccount,
  UpdateProviderInput,
} from 'src/graphql/entities/provider.entity';
import { User } from 'src/graphql/entities/user.entity';
import {
  ProviderRegistrationInput,
  UpdateBankInput,
} from 'src/graphql/entities/register-provider';

@Resolver(() => Provider)
export class ProvidersResolver {
  constructor(
    private readonly providersService: ProvidersService,
    private readonly usersService: UserService,
  ) {}

  // ==========================================
  // MUTATIONS (Registro y Edición)
  // ==========================================

  /**
   * Registra un usuario como proveedor.
   * Actualiza el teléfono en wp_usermeta, crea el Proveedor y la cuenta Bancaria.
   */
  @Mutation(() => Provider)
  @UseGuards(JwtAuthGuard)
  async registerProvider(
    @Args('input') input: ProviderRegistrationInput,
    @Context() context: any,
  ) {
    // Obtenemos el ID del usuario desde el Token validado
    const userId = Number(context.req.user.sub);

    return this.providersService.register(userId, input);
  }

  /**
   * Actualiza datos del perfil del proveedor (Bio, Logo, Ubicación, etc.)
   */
  @Mutation(() => Provider)
  @UseGuards(JwtAuthGuard)
  async updateProvider(
    @Args('updateProviderInput') input: UpdateProviderInput,
  ): Promise<Provider> {
    return this.providersService.updateProviderData(input);
  }

  /**
   * Actualiza exclusivamente los datos bancarios
   */
  @Mutation(() => BankAccount)
  @UseGuards(JwtAuthGuard)
  async updateBank(
    @Args('updateBankInput') input: UpdateBankInput,
  ): Promise<BankAccount> {
    return this.providersService.updateBankData(input);
  }

  // ==========================================
  // QUERIES (Consultas)
  // ==========================================

  /**
   * Obtiene el perfil del proveedor del usuario logueado
   */
  @Query(() => Provider, { name: 'myProvider', nullable: true })
  @UseGuards(JwtAuthGuard)
  async myProvider(@Context() context: any) {
    const userId = Number(context.req.user.sub);
    return this.providersService.findByUserId(userId);
  }

  /**
   * Lista pública de proveedores
   */
  @Query(() => [Provider], { name: 'providers' })
  async findAll() {
    return this.providersService.findAll();
  }

  /**
   * Obtiene un proveedor específico por su ID
   */
  @Query(() => Provider, { name: 'provider', nullable: true })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.providersService.findOne(id);
  }

  // ==========================================
  // FIELD RESOLVERS (Relaciones)
  // ==========================================

  /**
   * Permite obtener los datos del Usuario (User) cuando consultamos un Proveedor.
   * Ejemplo GQL: { providers { name, user { email } } }
   */
  @ResolveField(() => User)
  async user(@Parent() provider: Provider) {
    return this.usersService.findOne(provider.userId);
  }
}
