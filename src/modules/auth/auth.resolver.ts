import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { AuthService } from '../../modules/auth/auth.service';
import { AuthType, LoginInput } from 'src/graphql/entities/auth.entity'; // Asegúrate de importar CredentialsInput desde donde lo definiste (auth.input.ts o auth.entity.ts)
// Si CredentialsInput está en auth.input.ts, ajusta el import:
// import { CredentialsInput } from 'src/graphql/inputs/auth.input';
import { RegisterInput, User } from 'src/graphql/entities/user.entity';
import { IdentityInput } from 'src/graphql/entities/register-provider'; // Importar IdentityInput
import {
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CredentialsInput } from 'src/graphql/inputs/auth.input';

@Resolver(() => AuthType)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthType)
  async login(@Args('loginInput') loginInput: LoginInput): Promise<AuthType> {
    return await this.authService.login(loginInput);
  }

  @Mutation(() => AuthType)
  async register(@Args('input') input: RegisterInput): Promise<AuthType> {
    return this.authService.register(input);
  }
  // --- NUEVAS MUTACIONES PARA FLUJO DE PROVEEDOR ---

  @Mutation(() => Boolean)
  async findCredentialsAfterSendEmail(
    @Args('input') input: CredentialsInput,
  ): Promise<boolean> {
    // Verifica si el correo existe y envía código
    return this.authService.checkAndSendVerification(input);
  }

  @Mutation(() => String) // Retorna el Token (accessToken)
  async confirmEmailAndCreateUser(
    @Args('code') code: string,
    @Args('credentials') credentials: CredentialsInput,
    @Args('identity') identity: IdentityInput,
  ): Promise<string> {
    // Verifica código, crea usuario y retorna JWT

    console.log({ identity });
    const authResponse = await this.authService.confirmAndCreateUser(
      code,
      credentials,
      identity,
    );
    return authResponse.accessToken;
  }
}
