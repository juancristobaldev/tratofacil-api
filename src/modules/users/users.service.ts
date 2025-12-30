import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { GraphQLError } from 'graphql/error';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Renombrado a findAll para seguir la convención de NestJS
  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEmailVerification(email: string, code: string) {
    return this.prisma.emailVerification.upsert({
      where: { email },
      update: {
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
      create: {
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
  }

  async validateEmailCode(email: string, code: string) {
    const record = await this.prisma.emailVerification.findUnique({
      where: { email },
    });

    if (!record) {
      throw new GraphQLError('INVALID CODE');
    }

    if (record.code !== code) {
      throw new GraphQLError('INVALID CODE');
    }

    if (record.expiresAt < new Date()) {
      throw new GraphQLError('CODE EXPIRED');
    }

    await this.prisma.emailVerification.delete({
      where: { email },
    });

    return true;
  }

  // Renombrado a findOne para ser consistente con el Resolver
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async changeRole(userId: string, role: Role) {
    // Reutilizamos findOne para validar existencia
    await this.findOne(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  // Método para eliminar, necesario para la Mutation removeUser
  async remove(id: string) {
    await this.findOne(id); // Valida que exista antes de borrar

    return this.prisma.user.delete({
      where: { id },
    });
  }
}