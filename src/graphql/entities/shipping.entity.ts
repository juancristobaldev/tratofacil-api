import { ObjectType, Field, Int } from '@nestjs/graphql';
import { InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Matches,
} from 'class-validator';

@ObjectType()
export class ShippingInfo {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  region: string;

  @Field(() => String)
  commune: string;

  @Field(() => String)
  street: string;

  @Field(() => String)
  number: string;

  @Field(() => String, { nullable: true })
  dept?: string;

  @Field(() => String, { nullable: true })
  reference?: string;

  @Field(() => String)
  phone: string;

  @Field(() => Int)
  orderProductId: number;
}

@InputType()
export class CreateShippingInfoInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  region: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  commune: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  street: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  number: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  dept?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  reference?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  // Validación básica de teléfono (coincide con tu regex del front)
  @Matches(/^\+56\d{9}$|^\d{8,9}$/, { message: 'Formato de teléfono inválido' })
  phone: string;
}
