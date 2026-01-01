import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { Order } from './order.entity';

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
  @Field(() => String)
  orderId: string;

  @Field(() => Float)
  amount: number;

  @Field(() => PaymentProvider)
  provider: PaymentProvider;
}
