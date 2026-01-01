import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthType, LoginInput } from 'src/graphql/entities/auth.entity';
import * as bcrypt from 'bcrypt';
import { RegisterInput } from 'src/graphql/entities/user.entity';
import { Role } from 'src/graphql/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Utilidad para serializar roles de WP
  private getWpCapabilities(role: Role): string {
    const roleKey = role.toLowerCase();
    return `a:1:{s:${roleKey.length}:"${roleKey}";b:1;}`;
  }

  // Utilidad para obtener el rol desde metadatos
  private getRoleFromMeta(meta: any[]): Role {
    const capMeta = meta.find((m) => m.key === 'wp_capabilities');
    if (capMeta && capMeta.value) {
      if (capMeta.value.includes('admin')) return Role.ADMIN;
      if (capMeta.value.includes('provider')) return Role.PROVIDER;
    }
    return Role.CLIENT;
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return this.getMe(payload.sub);
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async register(data: RegisterInput): Promise<AuthType> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username || data.email }],
      },
    });

    if (existingUser) {
      throw new ConflictException('El usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Generamos datos compatibles con WP
    const username = data.username || data.email.split('@')[0];
    const nicename = username.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const display = data.displayName || username;
    const userRole = data.role || Role.CLIENT;

    // Preparamos metadatos
    const metaCreate = [
      { key: 'wp_capabilities', value: this.getWpCapabilities(userRole) },
      { key: 'wp_user_level', value: '0' },
      { key: 'nickname', value: username },
    ];

    if (data.phone) {
      metaCreate.push({ key: 'billing_phone', value: data.phone });
    }

    // 1. Crear en DB (Sin isEmailVerified)
    const newUser = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        username: username,
        displayName: display,
        nicename: nicename,
        url: '',
        registered: new Date(),
        status: 0,
        activationKey: '',
        usermeta: {
          create: metaCreate,
        },
      },
      include: {
        usermeta: true,
      },
    });

    // 2. Generar Token
    const token = this.jwtService.sign({
      sub: newUser.id,
      email: newUser.email,
      role: userRole,
    });

    // 3. Retornar AuthType válido
    // IMPORTANTE: Inyectamos 'role' manualmente porque Prisma devuelve el modelo de DB, no la Entidad GraphQL
    return {
      accessToken: token,
      user: {
        ...newUser,
        role: userRole,
      },
    };
  }

  async login(data: LoginInput): Promise<AuthType> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: { usermeta: true, provider: true },
    });

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Calculamos el rol desde la DB
    const userRole = this.getRoleFromMeta(user.usermeta);

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: userRole,
    });

    return {
      accessToken: token,
      user: {
        ...user,
        role: userRole,
      },
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { usermeta: true, provider: { include: { bank: true } } },
    });

    if (!user) throw new UnauthorizedException();

    // Inyección de Rol para GraphQL
    const userWithRole = {
      ...user,
      role: this.getRoleFromMeta(user.usermeta),
    };

    return userWithRole;
  }
}
