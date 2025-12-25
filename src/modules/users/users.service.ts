import { Injectable, NotFoundException } from '@nestjs/common';

import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async changeRole(userId: string, role: Role) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('Usuario no existe');

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}
