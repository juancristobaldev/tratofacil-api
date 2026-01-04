import { Global, Module } from '@nestjs/common';
import { WordpressService } from './wordpress.service';
import { HttpModule } from '@nestjs/axios';
import { WordpressController } from './wordpress.controller';

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 segundos de timeout para evitar cuelgues
      maxRedirects: 5,
    }),
  ], // Necesario para que WordpressService use this.httpService
  providers: [WordpressService],
  exports: [WordpressService],
  controllers: [WordpressController], // <--- 4. Crucial: Debes exportarlo para que otros lo usen
})
export class WordpressModule {}
