import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceResolver } from './marketplace.resolver';

describe('MarketplaceResolver', () => {
  let resolver: MarketplaceResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketplaceResolver],
    }).compile();

    resolver = module.get<MarketplaceResolver>(MarketplaceResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
