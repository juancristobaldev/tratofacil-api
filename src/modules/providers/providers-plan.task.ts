import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProvidersService } from './providers.service';
import { ProviderPlan } from '@prisma/client';

@Injectable()
export class ProvidersPlanTask {
  private readonly logger = new Logger(ProvidersPlanTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providersService: ProvidersService,
  ) {}

  /**
   * Se ejecuta todos los días a las 00:00 (medianoche)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredPlans() {
    this.logger.log('Iniciando revisión de planes expirados...');

    const now = new Date();

    // 1. Buscar proveedores con planes (no FREE) que ya vencieron
    const expiredProviders = await this.prisma.provider.findMany({
      where: {
        plan: { not: ProviderPlan.FREE },
        planEndsAt: { lt: now }, // Fecha de fin menor a "ahora"
        planActive: true,
      },
    });

    if (expiredProviders.length === 0) {
      this.logger.log('No se encontraron planes expirados hoy.');
      return;
    }

    this.logger.log(
      `Procesando expiración para ${expiredProviders.length} proveedores.`,
    );

    for (const provider of expiredProviders) {
      try {
        // 2. Usamos el setPlan que ya creamos para bajarlos a FREE
        // Esto automáticamente recalculará sus comisiones al 25%
        await this.providersService.setPlan(provider.id, ProviderPlan.FREE);

        this.logger.log(
          `Proveedor ${provider.name} (ID: ${provider.id}) degradado a FREE exitosamente.`,
        );
      } catch (error: any) {
        this.logger.error(
          `Error degradando al proveedor ${provider.id}: ${error.message}`,
        );
      }
    }
  }
}
