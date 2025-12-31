import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import { User } from './user.entity';
import { OrderStatus } from '@prisma/client'; // Usar el enum directo de Prisma
import { Service } from './service.entity';

@ObjectType()
export class PostMeta {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  postId: number;

  @Field()
  key: string;

  @Field()
  value: string;
}

@ObjectType()
export class Product {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Float, { nullable: true })
  netAmount?: number;

  @Field(() => Float, { nullable: true })
  commission?: number;

  // ID de la relación (útil para optimizar queries)
  @Field(() => Int, { nullable: true })
  serviceId?: number;

  // Relación con el Servicio (Subcategoría de WordPress)
  @Field(() => Service, { nullable: true })
  service?: Service;

  // Relación con metadatos (wp_postmeta)
  @Field(() => [PostMeta], { nullable: 'itemsAndList' })
  postmeta?: PostMeta[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Order {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  clientId: number;

  @Field(() => User, { nullable: true })
  client?: User;

  @Field(() => Int)
  productId: number;

  @Field(() => Product, { nullable: true })
  product?: Product;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Float, { nullable: true })
  total?: number;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@InputType()
export class CreateOrderInput {
  @Field()
  productId: string; // El ID del Producto/Oferta que se va a comprar
}
