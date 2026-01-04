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

  @Field(() => Int, { nullable: true })
  categoryId?: number; // Calculado o desde meta
  @Field(() => Int, { nullable: true })
  subCategoryId?: number; // Calculado o desde meta
  @Field(() => Float, { nullable: true })
  netAmount?: number; // Calculado

  @Field(() => Boolean)
  hasHomeVisit: boolean; // Desde meta
}

@ObjectType()
export class ServiceProvider {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  location?: string;

  @Field(() => Float)
  price: number;
}

@ObjectType()
export class ServiceByCategory {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  price: number; // precio mínimo

  @Field(() => Boolean)
  hasHomeVisit: boolean;

  @Field(() => [ServiceProvider])
  providers: ServiceProvider[];
}

@ObjectType()
export class ServiceDetail extends Service {
  @Field(() => Provider)
  provider: Provider;
}

@InputType()
export class CreateServiceInput {
  @Field(() => Int)
  @IsInt()
  categoryId: number; // 👈 categoría PADRE

  @Field(() => Int)
  @IsInt()
  subCategoryId: number; // 👈 categoría HIJA (servicio real)

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  price: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  hasHomeVisit?: boolean;
}

@InputType()
export class UpdateServiceInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  price?: number;
}
