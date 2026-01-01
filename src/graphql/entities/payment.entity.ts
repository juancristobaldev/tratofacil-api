import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
// RECOMENDADO: Usar enums locales registrados con registerEnumType en sus archivos

import { Order } from './order.entity';
import { IsEnum, IsInt, IsNumber } from 'class-validator';
import { PaymentProvider, PaymentStatus } from '@prisma/client';

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
  // ALINEACIÓN: Int (Era String)
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
