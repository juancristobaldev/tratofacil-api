import { Module } from '@nestjs/common';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { ProvidersResolver } from './providers.resolver';
import { UserService } from '../users/users.service';

@Module({
  controllers: [ProvidersController],
  providers: [ProvidersService, ProvidersResolver, UserService],
})
export class ProvidersModule {}
