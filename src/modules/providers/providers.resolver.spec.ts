import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersResolver } from './providers.resolver';

describe('ProvidersResolver', () => {
  let resolver: ProvidersResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProvidersResolver],
    }).compile();

    resolver = module.get<ProvidersResolver>(ProvidersResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
