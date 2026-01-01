import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Provider } from './provider.entity';

// =========================================================
// 1. ENTIDAD CATEGORY (Mapeo WpTerm + WpTermTaxonomy)
// =========================================================
@ObjectType()
export class Category {
  @Field(() => Int)
  id: number; // Mapeado desde term_id (BigInt)

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int, { nullable: true })
  parentId?: number; // Mapeado desde WpTermTaxonomy.parent

  @Field(() => Int)
  count: number; // Cantidad de productos en esta categoría
}

// =========================================================
// 2. ENTIDAD SERVICE (Mapeo WpPost + WpPostMeta)
// =========================================================
@ObjectType()
export class Service {
  @Field(() => Int)
  id: number; // Mapeado desde ID (BigInt)

  @Field()
  name: string; // post_title

  @Field({ nullable: true })
  description?: string; // post_content

  @Field()
  slug: string; // post_name

  @Field(() => Float, { nullable: true })
  price?: number; // De WpPostMeta (_regular_price)

  @Field(() => Float, { nullable: true })
  commission?: number; // Calculado (precio * 0.10)

  @Field(() => Float, { nullable: true })
  netAmount?: number; // Calculado (precio - comisión)

  @Field(() => Boolean)
  hasHomeVisit: boolean; // De WpPostMeta (meta_key personalizada)

  @Field()
  status: string; // post_status (publish, draft)

  // Relaciones
  @Field(() => Provider, { nullable: true })
  provider?: Provider;

  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field()
  createdAt: Date; // post_date
}

// =========================================================
// 3. INPUT: CREAR CATEGORÍA (Rubro)
// =========================================================
@InputType()
export class CreateCategoryInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  slug?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  parentId?: number;
}

// =========================================================
// 4. INPUT: CREAR SERVICIO (Producto WooCommerce)
// =========================================================
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
  @Min(0)
  price: number;

  @Field(() => Int)
  @IsInt()
  categoryId: number; // ID de la categoría (WpTerm)

  @Field(() => Int)
  @IsInt()
  providerId: number; // ID del Provider (tabla local)

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  hasHomeVisit: boolean;
}

// =========================================================
// 5. INPUT: ACTUALIZAR SERVICIO
// =========================================================
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

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasHomeVisit?: boolean;
}
