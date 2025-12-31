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
    const user = await this.prisma.user.findFirst({
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
  /**
   * REGISTRO (Adaptado a WordPress Schema)
   */
  async register(data: {
    email: string;
    password: string;
    username?: string;
    displayName?: string;
    role?: Role;
    phone?: string;
  }): Promise<any> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username || data.email.split('@')[0],
        password: hashedPassword,
        displayName:
          data.displayName || data.username || data.email.split('@')[0],
        role: data.role ?? Role.CLIENT,
        createdAt: new Date(),

        // CORRECCIÓN: 'create' debe recibir un ARREGLO []
        usermeta: data.phone
          ? {
              create: [
                {
                  // id: Math.floor(Math.random() * 1000000), // Descomenta si sigue pidiendo ID manual
                  key: 'billing_phone',
                  value: data.phone,
                },
              ],
            }
          : undefined,
      },
      include: {
        usermeta: true,
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
