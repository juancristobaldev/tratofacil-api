import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterInput, LoginInput } from 'src/graphql/entities/user.entity';
import { Role } from 'src/graphql/enums/role.enum';
import * as wpHash from 'wordpress-hash-node';
import * as PHP from 'php-serialize';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterInput) {
    const hashedPassword = wpHash.HashPassword(data.password);
    const wpRoleSlug = data.role === Role.PROVIDER ? 'provider' : 'customer';
    const capabilities = PHP.serialize({ [wpRoleSlug]: true });

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        username: data.username || data.email.split('@')[0],
        nicename: data.username || data.email.split('@')[0],
        displayName: data.displayName || data.email.split('@')[0],
        usermeta: {
          create: [
            { key: 'wp_capabilities', value: capabilities },
            {
              key: 'wp_user_level',
              value: data.role === Role.ADMIN ? '10' : '0',
            },
          ],
        },
      },
    });

    return {
      accessToken: this.jwtService.sign({ sub: user.id, role: data.role }),
      user: { ...user, role: data.role },
    };
  }

  async login(data: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: { usermeta: true },
    });

    if (!user || !wpHash.CheckPassword(data.password, user.password)) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const role = this.extractRole(user.usermeta);
    return {
      accessToken: this.jwtService.sign({ sub: user.id, role }),
      user: { ...user, role },
    };
  }

  private extractRole(usermeta: any[]): Role {
    const cap = usermeta.find((m) => m.key === 'wp_capabilities');
    if (!cap) return Role.CLIENT;
    const roles = PHP.unserialize(cap.value);
    if (roles.administrator) return Role.ADMIN;
    if (roles.provider) return Role.PROVIDER;
    return Role.CLIENT;
  }
}
