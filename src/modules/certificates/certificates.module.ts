import { Module } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CertificatesResolver } from './certificates.resolver';

@Module({
  providers: [CertificatesService, CertificatesResolver]
})
export class CertificatesModule {}
