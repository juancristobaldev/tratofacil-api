import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthType } from 'src/graphql/entities/auth.entity';
import { RegisterUserInput, User } from 'src/graphql/entities/user.entity';
import { LoginInput, CredentialsInput } from 'src/graphql/inputs/auth.input';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IdentityInput } from 'src/graphql/entities/register-provider';

@Resolver(() => AuthType)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  /**
   * LOGIN: Autenticación nativa
   */
  @Mutation(() => AuthType, {
    description: 'Inicia sesión y retorna el token con la info del usuario',
  })
  async login(@Args('loginInput') loginInput: LoginInput): Promise<AuthType> {
    return await this.authService.login(loginInput);
  }

  /**
   * REGISTER: Registro de usuario cliente básico
   */
  @Mutation(() => AuthType, {
    description: 'Registra un usuario nuevo (Cliente por defecto)',
  })
  async register(@Args('input') input: RegisterUserInput): Promise<AuthType> {
    return this.authService.register(input);
  }

  /**
   * SOLICITAR VERIFICACIÓN: Primer paso flujo proveedor
   */
  @Mutation(() => Boolean, {
    description:
      'Verifica disponibilidad de email y envía código de validación',
  })
  async findCredentialsAfterSendEmail(
    @Args('input') input: CredentialsInput,
  ): Promise<boolean> {
    return this.authService.checkAndSendVerification(input);
  }

  /**
   * CONFIRMAR Y CREAR: Segundo paso flujo proveedor (Atómico)
   * Ahora retorna AuthType completo para que el front tenga el user y el token de inmediato.
   */
  @Mutation(() => AuthType, {
    description: 'Confirma el código y crea el perfil de usuario + proveedor',
  })
  async confirmEmailAndCreateUser(
    @Args('code') code: string,
    @Args('credentials') credentials: CredentialsInput,
    @Args('identity') identity: IdentityInput,
  ): Promise<AuthType> {
    // Retornamos el objeto completo (accessToken + user) para ser consistente con Login
    return await this.authService.confirmAndCreateUser(
      code,
      credentials,
      identity,
    );
  }

  /**
   * GET ME: Obtener perfil del usuario autenticado
   */
  @Query(() => User, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  async getMe(@Context() context: any): Promise<User> {
    const userId = context.req.user.sub;

    // Convertimos explícitamente a number si sub viene como string del JWT
    const user = await this.authService.getMe(Number(userId));

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // El cast 'as unknown as User' rompe la cadena de inferencia de Prisma
    // y lo fuerza a tu entidad de GraphQL sin errores de compatibilidad.
    return user as unknown as User;
  }
}
