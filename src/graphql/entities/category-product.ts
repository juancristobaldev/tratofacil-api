import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  MinLength,
} from 'class-validator';
import { Product } from './product.entity'; // Asegúrate de que este archivo exista

/**
 * ENTIDAD CATEGORY PRODUCT (Output Object Type)
 * Alineada estrictamente con el modelo 'CategoryProduct' de tu Prisma Schema.
 */
@ObjectType()
export class CategoryProduct {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  slug: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  // RELACIÓN CON PRODUCTOS (Definida en el Schema de Prisma)
  @Field(() => [Product], {
    nullable: 'itemsAndList',
    description: 'Lista de productos que pertenecen a esta categoría',
  })
  products?: Product[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

/**
 * INPUT PARA CREAR CATEGORÍA DE PRODUCTO
 * Solo incluye campos presentes en la tabla de la BD.
 */
@InputType()
export class CreateCategoryProductInput {
  @Field(() => String)
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio' })
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  name: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'El slug es obligatorio para SEO' })
  @IsString()
  slug: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * INPUT PARA ACTUALIZAR CATEGORÍA DE PRODUCTO
 */
@InputType()
export class UpdateCategoryProductInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty({ message: 'El ID es necesario para identificar la categoría' })
  id: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  slug?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}
