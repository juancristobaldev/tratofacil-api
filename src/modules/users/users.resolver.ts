import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserService } from './users.service';
import { User, UpdateUserInput } from 'src/graphql/entities/user.entity';
import { Role } from 'src/graphql/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UserService,
  ) {}

  @Query(() => User, { nullable: true })
  async publicProfile(
    @Args('userId', { type: () => Int }) userId: number,
  ): Promise<User | null> {
    const provider = await this.prisma.provider.findFirst({
      where: { id: userId },
    });

    if (!provider) return null;

    const user = await this.usersService.findOne(provider.userId);

    // USAMOS EL DOBLE CAST para evitar que TS valide propiedades anidadas inexistentes
    return user as unknown as User;
  }

  @Query(() => User, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  async me(@Context() context: any): Promise<User> {
    const userId = Number(context.req.user.id);
    const user = await this.usersService.findOne(userId);

    // USAMOS EL DOBLE CAST
    return user as unknown as User;
  }

  @Query(() => [User], { name: 'users' })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(): Promise<User[]> {
    const users = await this.usersService.findAll();
    return users as unknown as User[];
  }

  @Query(() => User, { name: 'user', nullable: true })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Args('input') input: UpdateUserInput,
    @Context() context: any,
  ) {
    const userIdFromToken = Number(context.req.user.sub);
    const userRole = context.req.user.role;

    // Validación estricta
    if (userIdFromToken !== input.id && userRole !== Role.ADMIN) {
      throw new UnauthorizedException(
        'No tienes permiso para editar este usuario',
      );
    }

    return this.usersService.updateProfile(input.id, input);
  }
}
