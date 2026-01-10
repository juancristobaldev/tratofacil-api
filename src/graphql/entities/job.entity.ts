import {
  ObjectType,
  Field,
  Int,
  Float,
  PartialType,
  InputType,
} from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { Provider } from './provider.entity';
import { OrderJob } from './order-job.entity';
@ObjectType()
export class Job {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  providerId: number;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Provider)
  provider: Provider;

  @Field(() => [OrderJob], { nullable: true })
  orders?: OrderJob[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@InputType()
export class CreateJobInput {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  title: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  price?: number;
}

@InputType()
export class UpdateJobInput extends PartialType(CreateJobInput) {
  @Field(() => Int)
  id: number;
}
