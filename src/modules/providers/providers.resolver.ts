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
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

// Services
import { ProvidersService } from './providers.service';
import { UserService } from '../users/users.service';

// Entities & Inputs
import {
  Provider,
  BankAccount,
  UpdateProviderInput,
  BankAccountInput,
} from 'src/graphql/entities/provider.entity';
import { User } from 'src/graphql/entities/user.entity';

@Resolver(() => Provider)
export class ProvidersResolver {
  constructor(
    private readonly providersService: ProvidersService,
    private readonly usersService: UserService,
  ) {}

  // ==========================================
  // MUTATIONS (Registro y Edición Nativa)
  // ==========================================

  /**
   * Registra un usuario como proveedor (Lógica atómica nativa)
   */
  @Mutation(() => Provider)
  @UseGuards(JwtAuthGuard)
  async registerProvider(
    @Args('input') input: UpdateProviderInput, // Usamos el input alineado al service
    @Context() context: any,
  ) {
    // El sub suele ser el estándar en JWT para el ID del usuario
    const userId = Number(context.req.user.sub || context.req.user.id);

    if (!userId) throw new UnauthorizedException('Usuario no identificado');

    return this.providersService.register(userId, input);
  }

  /**
   * Actualiza datos del perfil del proveedor (Bio, Logo, Ubicación, Phone)
   */
  @Mutation(() => Provider)
  @UseGuards(JwtAuthGuard)
  async updateProvider(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateProviderInput,
  ): Promise<Provider> {
    return this.providersService.updateProviderData(id, input);
  }

  /**
   * Actualiza o crea datos bancarios vinculados al proveedor
   */
  @Mutation(() => BankAccount)
  @UseGuards(JwtAuthGuard)
  async updateBank(
    @Args('providerId', { type: () => Int }) providerId: number,
    @Args('input') input: BankAccountInput,
  ): Promise<BankAccount> {
    return this.providersService.updateBankData(providerId, input);
  }

  // ==========================================
  // QUERIES (Consultas Limpias)
  // ==========================================

  /**
   * Obtiene el perfil del proveedor del usuario logueado
   */
  @Query(() => Provider, { name: 'myProvider', nullable: true })
  @UseGuards(JwtAuthGuard)
  async myProvider(@Context() context: any) {
    const userId = Number(context.req.user.sub || context.req.user.id);
    return this.providersService.findByUserId(userId);
  }

  /**
   * Lista pública de proveedores con relaciones básicas
   */
  @Query(() => [Provider], { name: 'providers' })
  async findAll() {
    return this.providersService.findAll();
  }

  /**
   * Obtiene un proveedor específico por su ID con todas sus relaciones
   */
  @Query(() => Provider, { name: 'provider', nullable: true })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.providersService.findOne(id);
  }

  // ==========================================
  // FIELD RESOLVERS (Relaciones)
  // ==========================================

  /**
   * Resuelve la relación User para el Proveedor de forma eficiente
   */
  @ResolveField(() => User)
  async user(@Parent() provider: Provider) {
    return this.usersService.findOne(provider.userId);
  }
}
