import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  LoginInput,
  RegisterInput,
  CredentialsInput,
} from 'src/graphql/inputs/auth.input'; // Ajusta imports
import { IdentityInput } from 'src/graphql/entities/register-provider';
import { AuthType } from 'src/graphql/entities/auth.entity';
import { Role } from 'src/graphql/enums/role.enum';
import * as wpHash from 'wordpress-hash-node';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  // ... (métodos login, register, getMe existentes) ...
  // Asegúrate de mantener tu código existente de login/register aquí.
  private getWpCapabilities(role: Role): string {
    let wpRole = 'subscriber';

    if (role === Role.ADMIN) {
      wpRole = 'administrator';
    }

    if (role === Role.PROVIDER) {
      wpRole = 'vendor';
    }

    return `a:1:{s:${wpRole.length}:"${wpRole}";b:1;}`;
  }

  // Utilidad para deserializar roles
  private getRoleFromMeta(metaValue: string): Role {
    if (metaValue.includes('"administrator"')) {
      return Role.ADMIN;
    }

    if (metaValue.includes('"vendor"')) {
      return Role.PROVIDER;
    }

    return Role.CLIENT;
  }

  // Helper para asignar el rol a la entidad de salida
  private mapUserRole(user: any) {
    const capMeta = user.usermeta?.find(
      (m: any) => m.key === 'wp_capabilities',
    );

    const role = capMeta?.value
      ? this.getRoleFromMeta(capMeta.value)
      : Role.CLIENT;

    return {
      ...user,
      role,
    };
  }

  async login(loginInput: LoginInput): Promise<AuthType> {
    // ... tu lógica existente ...
    // Mock simple por si no lo tienes a mano:
    const user = await this.prisma.user.findUnique({
      where: { email: loginInput.email },
      include: {
        usermeta: true,
      },
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    // validar password con bcrypt...
    const mappedUser = this.mapUserRole(user);
    const payload = { ...mappedUser, sub: mappedUser.id };

    // Ajustar rol
    return {
      accessToken: this.jwtService.sign(payload),
      user: user as any,
    };
  }

  async register(registerInput: RegisterInput): Promise<AuthType> {
    const { email, password, role } = registerInput;

    // 1. Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    // 2. Hashear la contraseña (bcrypt es el estándar de la industria)
    const hashedPassword = wpHash.HashPassword(password);

    // 3. Generar un username (user_login) basado en el email
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

    // 4. Crear el usuario en la tabla de WordPress (wp_users)
    const newUser = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username: username,
        nicename: username,
        displayName: username,
        registered: new Date(),
        status: 0,
        url: '',
        activationKey: '',
      },
    });

    // 5. Asignar capacidades/roles en wp_usermeta (Opcional pero recomendado para WordPress)
    // El formato 'a:1:{s:6:"client";b:1;}' es el estándar serializado de PHP para roles de WP
    const wpRole = role === 'PROVIDER' ? 'vendor' : 'client';
    await this.prisma.userMeta.create({
      data: {
        userId: newUser.id,
        key: 'wp_capabilities',
        value: `a:1:{s:${wpRole.length}:"${wpRole}";b:1;}`,
      },
    });

    // 6. Generar el Token JWT
    const payload = {
      sub: newUser.id.toString(), // Convertimos BigInt a string para el JWT
      email: newUser.email,
      role: role || 'CLIENT',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: newUser as any,
    };
  }
  async getMe(userId: number | string) {
    const me = await this.prisma.user.findUnique({
      where: { id: typeof userId === 'string' ? Number(userId) : userId },
    });
    console.log({ me });
    return me;
  }

  // --- NUEVOS MÉTODOS ---

  async checkAndSendVerification(input: CredentialsInput): Promise<boolean> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new BadRequestException(
        'El correo electrónico ya está registrado.',
      );
    }

    // TODO: Integrar servicio de Email real.
    // Por ahora, generamos un código fijo "123456" o lo guardamos en una tabla temporal (Redis/DB).
    // Para MVP, simplemente retornamos true y asumimos que el usuario usará un código mágico o
    // implementas una tabla `EmailVerification` en Prisma.

    // Ejemplo guardando en tabla (si existe en tu schema prisma):
    // await this.prisma.emailVerification.create({ ... })

    console.log(`Código de verificación para ${input.email}: 123456`);
    return true;
  }
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return this.getMe(payload.sub);
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async confirmAndCreateUser(
    code: string,
    credentials: CredentialsInput,
    identity: IdentityInput,
  ): Promise<AuthType> {
    if (code !== '123456') {
      throw new BadRequestException('Código inválido');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: credentials.email },
    });
    if (existing) throw new BadRequestException('Usuario ya existe');

    const hashedPassword = wpHash.HashPassword(credentials.password);

    const username =
      credentials.email.split('@')[0] + Math.floor(Math.random() * 1000);

    const company = identity.company;

    console.log({
      company,
      username,
    });

    const displayName =
      identity.company ?? `${identity.firstName} ${identity.lastName}`;

    const newUser = await this.prisma.user.create({
      data: {
        email: credentials.email,
        username,
        password: hashedPassword,
        displayName,
        nicename: username,
        registered: new Date(),
        status: 0,
      },
    });

    await this.prisma.userMeta.createMany({
      data: [
        { userId: newUser.id, key: 'first_name', value: identity.firstName },
        { userId: newUser.id, key: 'last_name', value: identity.lastName },
        { userId: newUser.id, key: 'nickname', value: displayName },
        { userId: newUser.id, key: 'display_name', value: displayName },
        { userId: newUser.id, key: 'billing_phone', value: identity.phone },
        {
          userId: newUser.id,
          key: 'wp_capabilities',
          value: this.getWpCapabilities(Role.PROVIDER),
        },
        { userId: newUser.id, key: 'wp_user_level', value: '0' },
      ],
    });

    const mappedUser = this.mapUserRole(newUser);

    const payload = { sub: newUser.id, ...mappedUser };

    console.log({ payload });

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: payload,
    };
  }
}
