import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesResolver } from './services.resolver';

@Module({
  providers: [ServicesService, ServicesResolver],
})
export class ServicesModule {}
