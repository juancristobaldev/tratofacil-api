import { ObjectType, Field, Int } from '@nestjs/graphql';
import { OrderJob } from './order-job.entity';
import { InputType, PartialType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

@ObjectType()
export class ReviewsJob {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  rating: number;

  @Field(() => String, { nullable: true })
  comment?: string;

  @Field(() => Int)
  orderJobId: number;

  @Field(() => OrderJob)
  orderJob: OrderJob;

  @Field(() => Date)
  createdAt: Date;
}

@InputType()
export class CreateReviewsJobInput {
  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  orderJobId: number;

  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  comment?: string;
}

@InputType()
export class UpdateReviewsJobInput extends PartialType(CreateReviewsJobInput) {
  @Field(() => Int)
  id: number;
}
