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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registro de usuario coherente con wp_users y wp_usermeta
   */
  async register(data: RegisterInput): Promise<AuthType> {
    // 1. Verificar si el email o username ya existen
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username || data.email }],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'El correo electrónico o nombre de usuario ya está registrado',
      );
    }

    // 2. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Crear usuario en wp_users y metadatos en wp_usermeta de forma atómica
    const newUser = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        // WordPress requiere user_login (username) y display_name
        username: data.username || data.email.split('@')[0],
        displayName:
          data.displayName || data.username || data.email.split('@')[0],
        role: data.role || 'CLIENT',
        isEmailVerified: false,
        // Coherencia con metadatos de WordPress
        usermeta: {
          create: data.phone
            ? [{ key: 'billing_phone', value: data.phone }]
            : [],
        },
      },
      include: {
        usermeta: true,
      },
    });

    // 4. Generar Token y retornar AuthType
    const token = this.jwtService.sign({
      sub: newUser.id, // ID es Int, JWT lo serializa
      email: newUser.email,
      role: newUser.role,
    });

    return {
      accessToken: token,
      user: newUser,
    };
  }

  /**
   * Login coherente con el esquema de ID de tipo Int
   */
  async login(data: LoginInput): Promise<AuthType> {
    const { email, password } = data;

    // 1. Buscar usuario con sus metadatos
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { usermeta: true, provider: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Validar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Generar JWT
    const token = this.jwtService.sign({
      sub: user.id, // ID numérico coherente con el schema
      email: user.email,
      role: user.role,
    });

    return {
      accessToken: token,
      user: user,
    };
  }

  /**
   * Validación de token para Guards
   */
  async validateUser(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { usermeta: true, provider: true },
    });
  }

  /**
   * Obtener perfil del usuario actual (Me)
   */
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        usermeta: true,
        provider: {
          include: { bank: true },
        },
      },
    });

    if (!user) throw new UnauthorizedException();
    return user;
  }
}
