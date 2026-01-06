import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { Provider } from './provider.entity';
import { Category } from './category.entity';
import { Order } from './order.entity';
import { ServiceProviderOnCity } from './register-provider';

// =========================================================
// 1. ENTIDAD PIVOTE: SERVICE PROVIDER (La Oferta Específica)
// =========================================================

@ObjectType()
export class ServiceProvider {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  serviceId: number;

  @Field(() => Int)
  providerId: number;

  @Field()
  slug: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Float, { nullable: true })
  price?: number | null;

  @Field(() => Float, { nullable: true })
  commission?: number | null;

  @Field(() => Float, { nullable: true })
  netAmount?: number | null;

  @Field(() => Boolean)
  hasHomeVisit: boolean;
  @Field(() => [ServiceProviderOnCity], { nullable: true })
  cities?: ServiceProviderOnCity;
  // RELACIONES
  @Field(() => Service, { nullable: true })
  service?: Service | null;

  @Field(() => Provider, { nullable: true })
  provider?: Provider | null;

  @Field(() => [Order], { nullable: 'itemsAndList' })
  orders?: Order[];
}

// =========================================================
// 2. ENTIDAD PRINCIPAL: SERVICE (Catálogo General)
// =========================================================
@ObjectType()
export class Service {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field(() => String, { nullable: true })
  imageUrl?: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int, { nullable: true })
  categoryId?: number | null;

  // RELACIONES
  @Field(() => Category, { nullable: true })
  category?: Category | null;

  @Field(() => [ServiceProvider], { nullable: 'itemsAndList' })
  serviceProviders?: ServiceProvider[];
}

// =========================================================
// 3. TIPOS AUXILIARES / DTOs DE SALIDA
// =========================================================

@ObjectType()
export class ServiceByCategory {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field(() => [ServiceProvider])
  providers: ServiceProvider[];
}

// =========================================================
// 4. INPUTS
// =========================================================

@InputType()
export class CreateServiceInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  slug: string;

  @Field(() => String, { nullable: true })
  city?: string;
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @Field(() => Int)
  @IsInt()
  price: number;

  @Field(() => Boolean)
  @IsInt()
  hasHomeVisit: boolean;
}

@InputType()
export class UpdateServiceInput {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field(() => String, { nullable: true })
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => Int)
  @IsInt()
  price: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  categoryId?: number;
}

/**
 * INPUT PARA VINCULAR UN PROVEEDOR A UN SERVICIO (Crear Oferta)
 */
@InputType()
export class LinkServiceProviderInput {
  @Field(() => Int)
  @IsInt()
  serviceId: number;

  @Field(() => Int)
  @IsInt()
  providerId: number;

  @Field(() => String)
  @IsNotEmpty()
  slug: string;

  @Field(() => Float)
  @IsNumber()
  price: number;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  hasHomeVisit: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

@ObjectType()
export class ServiceDetail extends Service {
  @Field(() => Provider, { nullable: true })
  provider?: Provider;

  @Field(() => Service, { nullable: true })
  service?: Service;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Float, { nullable: true })
  commission?: number;

  @Field(() => Float, { nullable: true })
  netAmount?: number;

  @Field(() => Boolean, { nullable: true })
  hasHomeVisit?: boolean;
}
