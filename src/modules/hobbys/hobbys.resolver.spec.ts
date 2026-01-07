import { Test, TestingModule } from '@nestjs/testing';
import { HobbyResolver } from './hobbys.resolver';

describe('HobbysResolver', () => {
  let resolver: HobbyResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HobbyResolver],
    }).compile();

    resolver = module.get<HobbyResolver>(HobbyResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
