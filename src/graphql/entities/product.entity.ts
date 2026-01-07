import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Provider } from './provider.entity';
import { CategoryProduct } from './category-product';

// =========================================================
// 1. ENTIDADES (Output Types)
// =========================================================

@ObjectType()
export class ConditionDelivery {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  productId: number;

  @Field(() => String)
  deliveryType: string;

  @Field(() => String)
  shippingPayer: string;

  @Field(() => Int)
  maxDispatchDays: number;

  @Field(() => Date)
  confirmationDeadline: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class ProductImage {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  url: string;

  @Field(() => Int)
  productId: number;
}

@ObjectType()
export class Product {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  slug: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  stock: number;

  @Field(() => Int)
  providerId: number;

  @Field(() => Int)
  categoryProductId: number;

  @Field(() => [ProductImage], { nullable: 'itemsAndList' })
  images?: ProductImage[];

  // ✅ Nueva relación anidada en la entidad
  @Field(() => ConditionDelivery, { nullable: true })
  deliveryCondition?: ConditionDelivery;

  @Field(() => Provider, { nullable: true })
  provider?: Provider;

  @Field(() => CategoryProduct, { nullable: true })
  categoryProduct?: CategoryProduct;

  @Field(() => Date)
  createdAt: Date;
}

// =========================================================
// 2. INPUTS (Input Types)
// =========================================================

@InputType()
export class ConditionDeliveryInput {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  deliveryType: string;

  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  shippingPayer: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  maxDispatchDays: number;

  @Field(() => Date)
  @IsNotEmpty()
  @IsDate()
  confirmationDeadline: Date;
}

@InputType()
export class CreateProductInput {
  @Field(() => String)
  @IsNotEmpty()
  name: string;

  @Field(() => String)
  @IsNotEmpty()
  slug: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  stock: number;

  @Field(() => Int)
  categoryProductId: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  imageUrls?: string[];

  // ✅ Campo Conditions para creación
  @Field(() => ConditionDeliveryInput)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ConditionDeliveryInput)
  conditions: ConditionDeliveryInput;
}

@InputType()
export class UpdateProductInput {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  slug?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  price?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  stock?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  categoryProductId?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  imageUrls?: string[];

  // ✅ Campo Conditions para actualización (opcional)
  @Field(() => ConditionDeliveryInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConditionDeliveryInput)
  conditions?: ConditionDeliveryInput;
}
