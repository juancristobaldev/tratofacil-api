import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UserService } from 'src/modules/users/users.service';
import { UpdateUserInput, User } from 'src/graphql/entities/user.entity';
import { CredentialsInput, IdentityInput } from 'src/graphql/entities/register-provider';
import { GraphQLError } from 'graphql/error';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UserService,private readonly prisma: PrismaService, private readonly jwt:JwtService) {}

  @Query(() => User, { name: 'me', nullable: true })
  @UseGuards(JwtAuthGuard)
  async me(@Context() context: any) {
    const user = context.req.user;

    console.log(user)
    const userDB =  await this.prisma.user.findFirst({
      where: { id: user.id },
      include: {
        provider: {
          include: {
            bank: true,
            services: {
              include: {
                category: true, // Incluimos la categoría
              },
            },
          },
        },
      },
    });
    console.log(userDB)

return userDB
  }

  @Mutation(() => Boolean)
  async findCredentialsAfterSendEmail(
    @Args('input') input: CredentialsInput,
  ) {
    const user = await this.usersService.findByEmail(input.email);

    if (user) {
      throw new GraphQLError('EMAIL ALREADY USED');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.usersService.createEmailVerification(input.email, code);

    // 👉 Aquí enviarías el email
    console.log(`Verification code for ${input.email}: ${code}`);

    return true;
  }

  @Mutation(() => String)
  async confirmEmailAndCreateUser(
    @Args('code') code: string,
    @Args('credentials') credentials: CredentialsInput,
    @Args('identity') identity: IdentityInput,
  ) {
    // ✅ Confirmar email
    await this.usersService.validateEmailCode(credentials.email, code);

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(credentials.password, 10);

    // 👤 Crear usuario
    const user = await this.prisma.user.create({
      data: {
        email: credentials.email,
        password: hashedPassword,
        phone: identity.phone,
        role: 'PROVIDER',
        isEmailVerified: true,
      },
    });

    // 🎟️ Crear JWT
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return token;
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

  @Mutation(() => User)
async updateUser(
  @Args('updateUserInput') input: UpdateUserInput,
  @Context() context: any,
): Promise<User> {
  const authHeader = context.req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) throw new GraphQLError('UNAUTHORIZED');

  const payload = this.jwt.verify(token, { secret: process.env.JWT_SECRET });
  if (payload.sub !== input.userId) throw new GraphQLError('UNAUTHORIZED');

  return this.prisma.user.update({
    where: { id: input.userId },
    data: {
      email: input.email,
      phone: input.phone,
    },
  });
}
}