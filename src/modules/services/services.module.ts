import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesResolver } from './services.resolver';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, ServicesResolver]
})
export class ServicesModule {}
