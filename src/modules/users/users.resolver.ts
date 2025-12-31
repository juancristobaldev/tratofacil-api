import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import {
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UserService } from 'src/modules/users/users.service';
import { UpdateUserInput, User } from 'src/graphql/entities/user.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  CredentialsInput,
  IdentityInput,
} from 'src/graphql/entities/register-provider';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UserService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Query(() => User, { name: 'me', nullable: true })
  @UseGuards(JwtAuthGuard)
  async me(@Context() context: any) {
    // El ID en el JWT (sub) es un Number
    const userId = Number(context.req.user.sub);

    return await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        usermeta: true, // Coherencia con WP para traer el teléfono
        provider: {
          include: {
            bank: true,
            services: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
  }

  @Mutation(() => Boolean)
  async findCredentialsAfterSendEmail(@Args('input') input: CredentialsInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (user) {
      throw new BadRequestException('EMAIL_ALREADY_USED');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.usersService.createEmailVerification(input.email, code);

    console.log(`Verification code for ${input.email}: ${code}`);
    return true;
  }

  @Mutation(() => String)
  async confirmEmailAndCreateUser(
    @Args('code') code: string,
    @Args('credentials') credentials: CredentialsInput,
    @Args('identity') identity: IdentityInput,
  ) {
    await this.usersService.validateEmailCode(credentials.email, code);

    const hashedPassword = await bcrypt.hash(credentials.password, 10);

    // Creamos usuario en wp_users y el teléfono en wp_usermeta
    const user = await this.prisma.user.create({
      data: {
        email: credentials.email,
        password: hashedPassword,
        username: credentials.email.split('@')[0],
        displayName: `${identity.firstName} ${identity.lastName}`,
        role: 'PROVIDER',
        isEmailVerified: true,
        usermeta: {
          create: {
            key: 'billing_phone',
            value: identity.phone,
          },
        },
      },
    });

    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  @Query(() => [User], { name: 'users' })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll() {
    return await this.prisma.user.findMany({
      include: { usermeta: true },
    });
  }

  @Query(() => User, { name: 'user', nullable: true })
  @UseGuards(JwtAuthGuard)
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: { usermeta: true },
    });
  }

  @Mutation(() => Boolean)
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removeUser(@Args('id', { type: () => Int }) id: number) {
    await this.prisma.user.delete({ where: { id } });
    return true;
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Args('updateUserInput') input: UpdateUserInput,
    @Context() context: any,
  ): Promise<User> {
    const userIdFromToken = Number(context.req.user.sub);

    // Seguridad: Un usuario solo puede editarse a sí mismo (a menos que sea ADMIN)
    if (userIdFromToken !== input.id) {
      throw new UnauthorizedException(
        'No tienes permiso para actualizar este perfil',
      );
    }

    return this.prisma.user.update({
      where: { id: input.id },
      data: {
        email: input.email,
        displayName: input.displayName,
        // El teléfono se actualiza en usermeta si viene en el input
        ...(input.phone && {
          usermeta: {
            upsert: {
              where: {
                // Lógica de upsert para meta_key billing_phone
                id:
                  (
                    await this.prisma.userMeta.findFirst({
                      where: { userId: input.id, key: 'billing_phone' },
                    })
                  )?.id || 0,
              },
              update: { value: input.phone },
              create: { key: 'billing_phone', value: input.phone },
            },
          },
        }),
      },
      include: { usermeta: true },
    });
  }
}
