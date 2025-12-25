import { Module } from '@nestjs/common';
import { ProvidersController } from './providers.controller';
import { ProviderService } from './providers.service';


@Module({
  controllers: [ProvidersController],
  providers: [ProviderService]
})
export class ProvidersModule {}
