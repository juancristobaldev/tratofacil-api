import { registerEnumType } from '@nestjs/graphql';

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: 'Estado de la transacción de pago',
});
