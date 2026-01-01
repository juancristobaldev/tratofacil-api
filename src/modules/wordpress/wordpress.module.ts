import { Global, Module } from '@nestjs/common';
import { WordpressService } from './wordpress.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule], // Necesario para que WordpressService use this.httpService
  providers: [WordpressService],
  exports: [WordpressService], // <--- 4. Crucial: Debes exportarlo para que otros lo usen
})
export class WordpressModule {}
