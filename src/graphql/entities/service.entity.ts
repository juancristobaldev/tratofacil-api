import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import { Provider } from './provider.entity'; // Asegúrate de tener esto
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
} from 'class-validator';

@ObjectType()
export class Service {
  @Field(() => Int)
  id: number; // ID de wp_posts

  @Field()
  name: string; // post_title

  @Field()
  slug: string; // post_name

  @Field({ nullable: true })
  description?: string; // post_content

  @Field(() => Float, { nullable: true })
  price?: number; // Desde wp_postmeta (_price)

  @Field(() => Float, { nullable: true })
  commission?: number; // Calculado o desde meta

  @Field(() => Float, { nullable: true })
  netAmount?: number; // Calculado

  @Field(() => Boolean)
  hasHomeVisit: boolean; // Desde meta
}

@ObjectType()
export class ServiceDetail extends Service {
  @Field(() => Provider)
  provider: Provider;
}

// --- INPUTS ---

@InputType()
export class CreateServiceInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  price: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  categoryId?: number; // Para vincular con wp_terms
}

@InputType()
export class UpdateServiceInput {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  price?: number;
}
