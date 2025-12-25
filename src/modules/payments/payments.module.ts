import { Module } from '@nestjs/common';
import { PaymentService } from './payments.service';
import { PaymentsResolver } from './payments.resolver';


@Module({
  providers: [PaymentService, PaymentsResolver]
})
export class PaymentsModule {}
