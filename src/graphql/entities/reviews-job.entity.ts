import {
  ObjectType,
  Field,
  Int,
  InputType,
  PartialType,
} from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Job } from './job.entity';
import { Provider } from './provider.entity';
import { User } from './user.entity';

@ObjectType()
export class ReviewsJob {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  rating: number;

  @Field(() => String, { nullable: true })
  comment?: string;

  @Field(() => Int)
  jobId: number;

  @Field(() => Job)
  job: Job;

  @Field(() => Int)
  providerId: number;

  @Field(() => Provider)
  provider: Provider;

  @Field(() => Int)
  clientId: number;

  @Field(() => User)
  client: User;

  @Field(() => Date)
  createdAt: Date;
}

@InputType()
export class CreateReviewsJobInput {
  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  jobId: number;

  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  providerId: number;

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

  // El clientId se obtiene generalmente del contexto de autenticación en el resolver
}

@InputType()
export class UpdateReviewsJobInput extends PartialType(CreateReviewsJobInput) {
  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  id: number;
}
