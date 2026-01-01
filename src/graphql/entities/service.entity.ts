import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  IsInt,
} from 'class-validator';
import { Provider } from './provider.entity';
import { Category } from './category.entity';

@ObjectType()
export class ServiceProvider {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => Float, { nullable: true })
  price: number;

  @Field(() => Float, { nullable: true })
  commission: number;

  @Field(() => Float, { nullable: true })
  netAmount: number;

  @Field(() => String, { nullable: true })
  location?: string;
}

@ObjectType()
export class ServiceDetail {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  price: number;

  @Field(() => Float, { nullable: true })
  commission: number;

  @Field(() => Float, { nullable: true })
  netAmount: number;

  @Field(() => Boolean)
  hasHomeVisit: boolean;

  @Field(() => Provider)
  provider: Provider;
}

@ObjectType()
export class Service {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Float, { nullable: true })
  commission?: number;

  @Field(() => Float, { nullable: true })
  netAmount?: number;

  @Field(() => Boolean, { defaultValue: false })
  hasHomeVisit: boolean;

  @Field(() => [ServiceProvider], { nullable: 'itemsAndList' })
  providers?: ServiceProvider[];

  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;
}

@InputType()
export class CreateServiceInput {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  price: number;

  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  categoryId: number;

  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  providerId: number;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  hasHomeVisit: boolean;
}

@InputType()
export class UpdateServiceInput {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  price?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  hasHomeVisit?: boolean;
}
