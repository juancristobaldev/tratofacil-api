import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  Context,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import {
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// ALINEACIÓN DE ENUMS Y GUARDS
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/graphql/enums/role.enum'; // Enum local, no de Prisma

// SERVICIOS Y ENTIDADES
import { UpdateUserInput, User } from 'src/graphql/entities/user.entity';
import {
  CredentialsInput,
  IdentityInput,
} from 'src/graphql/entities/register-provider';

import * as PHP from 'php-serialize';
import { UserService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UserService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Obtener mi propio perfil (Usuario Autenticado)
   */
  @Query(() => User, { name: 'me', nullable: true })
  @UseGuards(JwtAuthGuard)
  async me(@Context() context: any) {
    const userId = Number(context.req.user.sub);
    return await this.usersService.findOne(userId);
  }

  /**
   * Paso 1: Validar email y enviar código de verificación
   */
  @Mutation(() => Boolean)
  async findCredentialsAfterSendEmail(@Args('input') input: CredentialsInput) {
    const user = await this.usersService.findByEmail(input.email);

    if (user) {
      throw new BadRequestException('EMAIL_ALREADY_USED');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.usersService.createEmailVerification(input.email, code);

    console.log(`[AUTH] Verification code for ${input.email}: ${code}`);
    return true;
  }

  /**
   * Paso 2: Confirmar código y crear usuario COMPATIBLE con WordPress
   */
  @Mutation(() => String)
  async confirmEmailAndCreateUser(
    @Args('code') code: string,
    @Args('credentials') credentials: CredentialsInput,
    @Args('identity') identity: IdentityInput,
  ) {
    // 1. Validar código
    await this.usersService.validateEmailCode(credentials.email, code);

    // 2. Delegar creación al servicio (él maneja el hash WP y las capabilities PHP)
    const displayName = `${identity.firstName} ${identity.lastName}`;
    const user = await this.usersService.createWpUser({
      email: credentials.email,
      password: credentials.password,
      displayName: displayName,
      role: Role.PROVIDER,
      phone: identity.phone,
    });

    // 3. Retornar Token alineado
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: Role.PROVIDER,
    });
  }

  @Query(() => [User], { name: 'users' })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll() {
    return await this.usersService.findAll();
  }

  @Query(() => User, { name: 'user', nullable: true })
  @UseGuards(JwtAuthGuard)
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return await this.usersService.findOne(id);
  }

  @Mutation(() => Boolean)
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removeUser(@Args('id', { type: () => Int }) id: number) {
    await this.usersService.remove(id);
    return true;
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Args('updateUserInput') input: UpdateUserInput,
    @Context() context: any,
  ): Promise<User> {
    const userIdFromToken = Number(context.req.user.sub);

    // Seguridad: Solo el dueño o el ADMIN edita
    if (userIdFromToken !== input.id) {
      // Podrías permitirlo si context.req.user.role === 'ADMIN'
      throw new UnauthorizedException(
        'No tienes permiso para actualizar este perfil',
      );
    }

    return this.usersService.update(input.id, input);
  }

  /**
   * RESOLVE FIELD: Extrae el Rol de los metadatos de WordPress
   * Esto hace que el campo 'role' en GraphQL sea dinámico y real.
   */
  @ResolveField(() => Role, { name: 'role' })
  async resolveRole(@Parent() user: User) {
    // Buscamos la clave de capabilities de WP
    const capabilities = user.usermeta?.find(
      (m) => m.key === 'wp_capabilities',
    );

    if (!capabilities || !capabilities.value) {
      return Role.CLIENT;
    }

    try {
      // PHP Unserialize para leer el rol de WordPress
      const rolesObj = PHP.unserialize(capabilities.value);
      const rolesNames = Object.keys(rolesObj);

      if (rolesNames.includes('administrator')) return Role.ADMIN;
      if (rolesNames.includes('provider')) return Role.PROVIDER;

      return Role.CLIENT;
    } catch (e) {
      return Role.CLIENT;
    }
  }
}
