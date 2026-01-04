import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserService } from './users.service';
import {
  User,
  RegisterInput,
  UpdateUserInput,
} from 'src/graphql/entities/user.entity';
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
    // Trae el usuario con su metadata y proveedor si exist

    const provider = await this.prisma.provider.findFirst({
      where: {
        id: userId,
      },
    });
    if (!provider) return null;

    const user = await this.usersService.findOne(provider?.userId);

    return {
      ...user,
    };
  }

  @Query(() => User, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  async me(@Context() context: any) {
    // sub es el ID del usuario
    return this.usersService.findOne(Number(context.req.user.id));
  }

  @Query(() => [User], { name: 'users' })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll() {
    return this.usersService.findAll();
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
