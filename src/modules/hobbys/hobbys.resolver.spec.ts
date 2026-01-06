import { Test, TestingModule } from '@nestjs/testing';
import { HobbysResolver } from './hobbys.resolver';

describe('HobbysResolver', () => {
  let resolver: HobbysResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HobbysResolver],
    }).compile();

    resolver = module.get<HobbysResolver>(HobbysResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
