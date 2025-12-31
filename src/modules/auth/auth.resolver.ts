import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { AuthService } from '../../modules/auth/auth.service';
import { AuthType, LoginInput } from 'src/graphql/entities/auth.entity';
import { RegisterInput, User } from 'src/graphql/entities/user.entity';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Resolver(() => AuthType)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  /**
   * Mutación de Login: Retorna accessToken y User (con IDs como Int)
   */
  @Mutation(() => AuthType)
  async login(@Args('loginInput') loginInput: LoginInput): Promise<AuthType> {
    // Coherencia: El servicio ahora recibe el DTO completo
    return await this.authService.login(loginInput);
  }

  /**
   * Mutación de Registro: Retorna AuthType para login automático
   */
  @Mutation(() => AuthType) // Cambiado de User a AuthType para coherencia con el Service
  async register(
    @Args('registerInput') registerInput: RegisterInput,
  ): Promise<AuthType> {
    // El servicio procesa el registro y genera el JWT automáticamente
    return await this.authService.register(registerInput);
  }

  /**
   * Query Me: Para obtener el perfil del usuario autenticado
   */
  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async me(@Context() context: any): Promise<User> {
    // context.req.user.sub contiene el ID numérico extraído del JWT
    return await this.authService.getMe(context.req.user.sub);
  }
}
