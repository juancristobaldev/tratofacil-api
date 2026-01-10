import { Module } from '@nestjs/common';
import { JobsInstaService } from './jobs-insta.service';
import { JobsInstaResolver } from './jobs-insta.resolver';
import { PaymentService } from '../payments/payments.service';

@Module({
  providers: [JobsInstaService, JobsInstaResolver, PaymentService],
})
export class JobsInstaModule {}
