import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/graphql/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * LOGIN
   */
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  /**
   * REGISTRO (opcional, pero útil)
   */
  async register(data: {
    email: string;
    password: string;
    role?: Role;
    phone?: string;
  }) :Promise <User>{
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role ?? Role.CLIENT,
        phone: data.phone,
      },
    });
  }

  /**
   * USADO POR EL CONTEXT / GUARDS
   */
  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });
    } catch {
      return null;
    }
  }
}
