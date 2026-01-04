import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import { Provider } from './provider.entity';
import { Category } from './category.entity';
import { IsString, IsOptional, IsNumber, IsInt } from 'class-validator';

// =========================================================
// ENTIDAD PIVOTE: SERVICE PROVIDER
// =========================================================
@ObjectType()
export class ServiceProvider {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  serviceId: number;

  @Field(() => Int)
  providerId: number;

  // IMPORTANTE: Este campo debe existir en tu tabla ServiceProvider en Prisma
  // para que cada proveedor tenga su propio precio.
  @Field(() => Float, { nullable: true })
  price?: number;

  // Relaciones
  @Field(() => Provider)
  provider: Provider;

  @Field(() => Service)
  service: Service;
}

// =========================================================
// ENTIDAD PRINCIPAL: SERVICE
// =========================================================
@ObjectType()
export class Service {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  price?: number; // Precio base o referencia

  @Field(() => Float, { nullable: true })
  commission?: number;

  @Field(() => Int, { nullable: true })
  categoryId?: number;

  @Field(() => Int, { nullable: true })
  subCategoryId?: number;

  @Field(() => Float, { nullable: true })
  netAmount?: number;

  @Field(() => Boolean)
  hasHomeVisit: boolean;

  // RELACIONES QUE FALTABAN
  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field(() => Category, { nullable: true })
  subCategory?: Category;

  @Field(() => [ServiceProvider], { nullable: 'itemsAndList' })
  serviceProviders?: ServiceProvider[];
}

// =========================================================
// TIPOS AUXILIARES / DTOs DE SALIDA
// =========================================================

// Usado para listar servicios por categoría con estructura simplificada
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
  price: number;

  @Field(() => Boolean)
  hasHomeVisit: boolean;

  @Field(() => [ServiceProvider])
  providers: ServiceProvider[];
}

@ObjectType()
export class ServiceDetail extends Service {
  // Este objeto extendido es útil si necesitas devolver un servicio
  // con un proveedor pre-seleccionado o lógica específica.
  @Field(() => Provider, { nullable: true })
  provider?: Provider;
}

// =========================================================
// INPUTS
// =========================================================

@InputType()
export class CreateServiceInput {
  @Field(() => Int)
  @IsInt()
  categoryId: number;

  @Field(() => Int)
  @IsInt()
  subCategoryId: number;

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
