import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from '../../modules/auth/auth.service';
import { AuthType } from 'src/graphql/entities/auth.entity';
import { LoginInput, RegisterInput } from 'src/graphql/inputs/auth.input';
import { User } from 'src/graphql/entities/user.entity';




@Resolver(() => AuthType)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthType)
  async login(@Args('loginInput') loginInput: LoginInput): Promise<AuthType> {
    const { email, password } = loginInput;
    // El servicio retorna { accessToken, user } que coincide con nuestra Auth entity
    return await this.authService.login(email, password);
  }

  @Mutation(() => User)
  async register(@Args('registerInput') registerInput: RegisterInput): Promise<User> {
    // El servicio espera un objeto con { email, password, phone?, role? }
    return await this.authService.register(registerInput);
  }
}