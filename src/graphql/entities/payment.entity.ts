import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import { PaymentProvider } from '../enums/payment-provider.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Order } from './order.entity';
import { IsEnum, IsInt, IsNumber } from 'class-validator';

@ObjectType()
export class Payment {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  orderId: number;

  @Field(() => Order, { nullable: true })
  order?: Order;

  @Field(() => Float)
  amount: number;

  @Field(() => PaymentProvider)
  provider: PaymentProvider;

  @Field(() => PaymentStatus)
  status: PaymentStatus;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

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
