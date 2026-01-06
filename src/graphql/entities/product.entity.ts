import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  IsUrl,
} from 'class-validator';
import { Provider } from './provider.entity';
import { CategoryProduct } from './category-product';

/**
 * ENTIDAD PRODUCT (Output Object Type)
 * Alineada con el modelo 'Product' de Prisma.
 */
@ObjectType()
export class Product {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  slug: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Especificaciones del producto en formato JSON stringificado',
  })
  specifications?: string | null;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  stock: number;

  @Field(() => String, { nullable: true })
  imageUrl?: string | null;

  @Field(() => Int)
  providerId: number;

  @Field(() => Int)
  categoryProductId: number;

  // RELACIONES
  @Field(() => Provider, { nullable: true })
  provider?: Provider;

  @Field(() => CategoryProduct, { nullable: true })
  categoryProduct?: CategoryProduct;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

/**
 * INPUT PARA CREAR PRODUCTO
 */
@InputType()
export class CreateProductInput {
  @Field(() => String)
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  name: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'El slug es obligatorio' })
  @IsString()
  slug: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Debe enviarse como un JSON string (ej: "{"color": "rojo"}")',
  })
  @IsOptional()
  @IsString()
  specifications?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  stock: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'La URL de la imagen no es válida' })
  imageUrl?: string;

  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  categoryProductId: number;

  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  providerId: number;
}

/**
 * INPUT PARA ACTUALIZAR PRODUCTO
 */
@InputType()
export class UpdateProductInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  id: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  slug?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  specifications?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  categoryProductId?: number;
}
