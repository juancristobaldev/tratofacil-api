import { Test, TestingModule } from '@nestjs/testing';
import { CertificatesResolver } from './certificates.resolver';

describe('CertificatesResolver', () => {
  let resolver: CertificatesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CertificatesResolver],
    }).compile();

    resolver = module.get<CertificatesResolver>(CertificatesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
