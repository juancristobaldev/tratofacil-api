import { Module } from '@nestjs/common';
import { PaymentService } from './payments.service';


@Module({
  providers: [PaymentService]
})
export class PaymentsModule {}
