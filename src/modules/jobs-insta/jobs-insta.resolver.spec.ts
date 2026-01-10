import { Test, TestingModule } from '@nestjs/testing';
import { JobsInstaResolver } from './jobs-insta.resolver';

describe('JobsInstaResolver', () => {
  let resolver: JobsInstaResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsInstaResolver],
    }).compile();

    resolver = module.get<JobsInstaResolver>(JobsInstaResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
