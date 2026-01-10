import { Test, TestingModule } from '@nestjs/testing';
import { JobsInstaService } from './jobs-insta.service';

describe('JobsInstaService', () => {
  let service: JobsInstaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsInstaService],
    }).compile();

    service = module.get<JobsInstaService>(JobsInstaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
