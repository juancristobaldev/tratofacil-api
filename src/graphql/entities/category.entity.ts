import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  MinLength,
} from 'class-validator';
import { Service } from './service.entity';

/**
 * ENTIDAD CATEGORY (Output Object Type)
 * Alineada con el modelo 'Category' de Prisma.
 */
@ObjectType()
export class Category {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  slug: string;

  @Field(() => String, { nullable: true })
  imageUrl?: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int, { nullable: true })
  parentId?: number | null;

  // RELACIONES
  @Field(() => [Service], {
    nullable: 'itemsAndList',
    description: 'Servicios asociados a esta categoría',
  })
  services?: Service[];
}

/**
 * INPUT PARA CREAR CATEGORÍA
 */
@InputType()
export class CreateCategoryInput {
  @Field(() => String)
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MinLength(3)
  name: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'El slug es obligatorio' })
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
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

/**
 * INPUT PARA ACTUALIZAR CATEGORÍA
 */
@InputType()
export class UpdateCategoryInput {
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

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  parentId?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
