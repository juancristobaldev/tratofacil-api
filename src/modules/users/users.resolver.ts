import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UserService } from 'src/modules/users/users.service';
import { User } from 'src/graphql/entities/user.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UserService) {}

  @Query(() => User, { name: 'me', nullable: true })
  @UseGuards(JwtAuthGuard)
  async me(@Context() context: any) {
    // El JwtAuthGuard ya inyectó el usuario en el request
    return context.req.user;
  }

  @Query(() => [User], { name: 'users' })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll() {
    const users = await this.usersService.findAll();
    // Transformamos null a undefined para cumplir con el tipo de la entidad
    return users.map(user => ({
      ...user,
      phone: user.phone ?? undefined,
    }));
  }

  @Query(() => User, { name: 'user' })
  @UseGuards(JwtAuthGuard)
  async findOne(@Args('id', { type: () => ID }) id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) return null;
    
    return {
      ...user,
      phone: user.phone ?? undefined,
    };
  }

  @Mutation(() => Boolean)
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removeUser(@Args('id', { type: () => ID }) id: string) {
    await this.usersService.remove(id);
    return true;
  }
}