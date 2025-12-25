import { Module } from '@nestjs/common';
import { ProvidersController } from './providers.controller';
import { ProviderService } from './providers.service';
import { ProvidersResolver } from './providers.resolver';


@Module({
  controllers: [ProvidersController],
  providers: [ProviderService, ProvidersResolver]
})
export class ProvidersModule {}
