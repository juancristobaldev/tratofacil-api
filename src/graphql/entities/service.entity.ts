import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import { Provider } from './provider.entity';
import { Category } from './category.entity';
import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
} from 'class-validator';

@ObjectType()
export class ServiceProvider {
  @Field(() => Int) // ID del Product (wp_posts)
  id: number;

  @Field()
  name: string;

  @Field(() => Float, { nullable: true })
  price: number;

  @Field(() => Float, { nullable: true })
  commission: number;

  @Field(() => Float, { nullable: true })
  netAmount: number;

  @Field({ nullable: true })
  location?: string; // Extraído del Provider vinculado
}

@ObjectType()
export class ServiceDetail {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  price: number;

  @Field(() => Float, { nullable: true })
  commission: number;

  @Field(() => Float, { nullable: true })
  netAmount: number;

  @Field(() => Boolean)
  hasHomeVisit: boolean; // Se resuelve desde PostMeta 'has_home_visit'

  @Field(() => Provider)
  provider: Provider;
}

@ObjectType()
export class Service {
  @Field(() => Int) // term_id en wp_terms
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  price?: number; // Precio base o promedio si se desea

  @Field(() => Float, { nullable: true })
  commission?: number;

  @Field(() => Float, { nullable: true })
  netAmount?: number;

  @Field(() => Boolean, { defaultValue: false })
  hasHomeVisit: boolean;

  // Lista de ofertas de proveedores (Productos vinculados a este Service)
  @Field(() => [ServiceProvider], { nullable: 'itemsAndList' })
  providers?: ServiceProvider[];

  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field({ nullable: true })
  createdAt?: Date;
}

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

  @Field()
  @IsNotEmpty()
  @IsString()
  categoryId: string; // Se recibe como String y el Service hace el parseInt a Int

  @Field()
  @IsNotEmpty()
  @IsString()
  providerId: string; // ID del proveedor que crea la oferta (para PostMeta)

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  hasHomeVisit: boolean;
}

@InputType()
export class UpdateServiceInput {
  @Field(() => Int) // Para actualizar, el ID del Producto es obligatorio
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

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  hasHomeVisit?: boolean;
}
