import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  MinLength,
} from 'class-validator';

/**
 * ENTIDAD CATEGORY PRODUCT (Output Object Type)
 * Representa la estructura de una categoría de producto en el Marketplace.
 * Alineada con el modelo 'CategoryProduct' de Prisma.
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

  @Field(() => Int, { nullable: true })
  parentId?: number | null;

  // RELACIONES JERÁRQUICAS
  @Field(() => [CategoryProduct], {
    nullable: 'itemsAndList',
    description: 'Lista de subcategorías pertenecientes a esta categoría',
  })
  children?: CategoryProduct[];

  @Field(() => CategoryProduct, {
    nullable: true,
    description: 'Categoría de nivel superior',
  })
  parent?: CategoryProduct | null;

  // RELACIÓN CON PRODUCTOS
  // Nota: Se habilitará cuando se defina la entidad Product
  // @Field(() => [Product], { nullable: 'itemsAndList' })
  // products?: any[];
}

/**
 * INPUT PARA CREAR CATEGORÍA DE PRODUCTO
 * Alineado con el método create() del CategoryProductService.
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

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  parentId?: number;
}

/**
 * INPUT PARA ACTUALIZAR CATEGORÍA DE PRODUCTO
 * Alineado con el método update() del CategoryProductService.
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

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  parentId?: number;
}
