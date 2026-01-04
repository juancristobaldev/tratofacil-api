import {
  ObjectType,
  Field,
  Int,
  Float,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsInt, IsNumber } from 'class-validator';
import { PaymentProvider } from '../enums/payment-provider.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Order } from './order.entity';

/* ======================
   REGISTRAR ENUMS
====================== */
registerEnumType(PaymentProvider, { name: 'PaymentProvider' });
registerEnumType(PaymentStatus, { name: 'PaymentStatus' });

@ObjectType()
export class Payment {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  orderId: number;

  @Field(() => Order, { nullable: true })
  order?: Order | null;

  @Field(() => Float)
  amount: number;

  @Field(() => PaymentProvider)
  provider: PaymentProvider;

  @Field(() => PaymentStatus)
  status: PaymentStatus;

  @Field(() => String, { nullable: true })
  transactionId?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

/* ======================
   INPUT
====================== */

@InputType()
export class CreatePaymentInput {
  @Field(() => Int)
  @IsInt()
  orderId: number;

  @Field(() => Float)
  @IsNumber()
  amount: number;

  @Field(() => PaymentProvider)
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;
}
