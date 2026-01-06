import { Module } from '@nestjs/common';
import { HobbyService } from './hobbys.service';
import { HobbyResolver } from './hobbys.resolver';

@Module({
  providers: [HobbyService, HobbyResolver],
})
export class HobbysModule {}
