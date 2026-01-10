import {
  ObjectType,
  Field,
  Int,
  Float,
  InputType,
  PartialType,
} from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';
import { Job } from './job.entity';
import { User } from './user.entity';
import { PaymentJob } from './payment.entity';

@ObjectType()
export class OrderJob {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  jobId: number;

  @Field(() => Int)
  clientId: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Float, { nullable: true })
  total?: number;

  @Field(() => Job)
  job: Job;

  @Field(() => User)
  client: User;

  @Field(() => PaymentJob, { nullable: true })
  payment?: PaymentJob;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@InputType()
export class CreateOrderJobInput {
  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  jobId: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  total?: number;

  // El clientId se maneja normalmente vía AuthGuard/Context,
  // no se incluye aquí para evitar que un usuario cree órdenes para otros.
}

@InputType()
export class UpdateOrderJobInput extends PartialType(CreateOrderJobInput) {
  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  id: number;

  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
