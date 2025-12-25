import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Conecta Prisma al iniciar el módulo
  async onModuleInit() {
    await this.$connect();
  }

  // Desconecta Prisma al destruir el módulo
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
