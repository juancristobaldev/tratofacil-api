import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceResolver } from './marketplace.resolver';

@Module({
  providers: [MarketplaceService, MarketplaceResolver]
})
export class MarketplaceModule {}
