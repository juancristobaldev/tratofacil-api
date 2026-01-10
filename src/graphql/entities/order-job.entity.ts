import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { OrderStatus } from '../enums/order-status.enum';
import { Job } from './job.entity';
import { User } from './user.entity';
import { InputType, PartialType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { PaymentJob } from './payment.entity';
import { ReviewsJob } from './reviews-job.entity';

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

  @Field(() => [ReviewsJob], { nullable: true })
  review?: ReviewsJob[];

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

  // Nota: clientId suele inyectarse desde el request/auth user,
  // pero si necesitas enviarlo manualmente:
  // @Field(() => Int)
  // clientId: number;
}

@InputType()
export class UpdateOrderJobInput extends PartialType(CreateOrderJobInput) {
  @Field(() => Int)
  id: number;

  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
