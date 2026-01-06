import { Test, TestingModule } from '@nestjs/testing';
import { HobbysService } from './hobbys.service';

describe('HobbysService', () => {
  let service: HobbysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HobbysService],
    }).compile();

    service = module.get<HobbysService>(HobbysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
