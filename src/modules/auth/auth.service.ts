import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthType } from 'src/graphql/entities/auth.entity';
import { LoginInput } from 'src/graphql/inputs/auth.input';
import { RegisterInput, User } from 'src/graphql/entities/user.entity';
import { Role } from 'src/graphql/enums/role.enum';

// LIBRERÍAS DE COMPATIBILIDAD WORDPRESS (¡Instálalas!)
import * as wpHash from 'wordpress-hash-node';
import * as PHP from 'php-serialize';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Valida el token JWT y retorna el usuario
   */
  async validateToken(token: string): Promise<User> {
    try {
      const payload = this.jwtService.verify(token);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          usermeta: true,
          provider: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // Inyectamos el rol recuperado de los metadatos para que el Guard funcione
      const role = this.getUserRole(user.usermeta);
      return { ...user, role } as any;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /**
   * Registro 100% compatible con WordPress / WooCommerce
   */
  async register(data: RegisterInput): Promise<AuthType> {
    // 1. Validar duplicados
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username || data.email }],
      },
    });

    if (existingUser) {
      throw new ConflictException('El correo o usuario ya existe');
    }

    // 2. Hash de contraseña formato WordPress ($P$B...)
    const hashedPassword = wpHash.HashPassword(data.password);

    // 3. Preparar Rol Serializado para WP (ej: a:1:{s:8:"provider";b:1;})
    // Mapeamos nuestro Enum a los slugs de roles de WP
    let wpRoleSlug = 'customer'; // Default WooCommerce
    if (data.role === Role.PROVIDER) wpRoleSlug = 'provider'; // Asegúrate de tener este rol en WP
    if (data.role === Role.ADMIN) wpRoleSlug = 'administrator';

    const capabilities = PHP.serialize({ [wpRoleSlug]: true });
    const userLevel = data.role === Role.ADMIN ? '10' : '0';

    // 4. Crear Usuario + Metadatos (Transacción implícita de Prisma)
    const newUser = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        username: data.username || data.email.split('@')[0],
        displayName:
          data.displayName || data.username || data.email.split('@')[0],
        registered: new Date(),
        status: 0,
        // NO asignamos 'role' ni 'isEmailVerified' aquí porque no existen en wp_users

        usermeta: {
          create: [
            { key: 'wp_capabilities', value: capabilities }, // La clave puede variar según tu prefijo de DB (ej: tf_capabilities)
            { key: 'wp_user_level', value: userLevel },
            {
              key: 'nickname',
              value: data.username || data.email.split('@')[0],
            },
            ...(data.phone
              ? [{ key: 'billing_phone', value: data.phone }]
              : []),
          ],
        },
      },
      include: {
        usermeta: true,
      },
    });

    // 5. Generar Token (Usamos el rol del input porque ya sabemos cuál es)
    const token = this.jwtService.sign({
      sub: newUser.id,
      email: newUser.email,
      role: data.role,
    });

    // Retornamos el objeto alineado (inyectando el rol manualmente al objeto User de respuesta)
    return {
      accessToken: token,
      user: { ...newUser, role: data.role } as any,
    };
  }

  /**
   * Login compatible con contraseñas de WordPress
   */
  async login(data: LoginInput): Promise<AuthType> {
    const { email, password } = data;

    // 1. Buscar usuario y sus metadatos (necesarios para saber el rol)
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { usermeta: true, provider: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Validar contraseña usando librería de WP
    const isPasswordValid = wpHash.CheckPassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Extraer el rol desde wp_usermeta
    const role = this.getUserRole(user.usermeta);

    // 4. Generar Token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: role, // Importante para los @Roles Guards
    });

    return {
      accessToken: token,
      user: { ...user, role } as any,
    };
  }

  async validateUser(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { usermeta: true, provider: true },
    });
  }

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

    // Inyectamos el rol para que el Frontend lo reciba
    const role = this.getUserRole(user.usermeta);
    return { ...user, role } as any;
  }

  // ---------------------------------------------------------
  // HELPERS PRIVADOS
  // ---------------------------------------------------------

  /**
   * Decodifica el rol de WordPress almacenado en usermeta
   */
  private getUserRole(usermeta: any[]): Role {
    if (!usermeta || usermeta.length === 0) return Role.CLIENT;

    // Busca la meta_key de capacidades (ajusta 'wp_capabilities' si tu prefijo de DB es diferente)
    const capMeta = usermeta.find(
      (m) => m.key === 'wp_capabilities' || m.key === 'tf_capabilities',
    );

    if (capMeta && capMeta.value) {
      try {
        // Deserializa: a:1:{s:13:"administrator";b:1;} -> { administrator: true }
        const caps = PHP.unserialize(capMeta.value);

        if (caps.administrator) return Role.ADMIN;
        if (caps.provider) return Role.PROVIDER;
        if (caps.customer || caps.subscriber) return Role.CLIENT;
      } catch (e) {
        console.error('Error deserializando capacidades de WP:', e);
      }
    }

    return Role.CLIENT; // Fallback
  }
}
