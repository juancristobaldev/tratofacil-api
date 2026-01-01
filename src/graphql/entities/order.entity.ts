import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import { User } from './user.entity';
// --------------------------------------------------------
// CORRECCIÓN: Importar desde el archivo enum, NO de Prisma
import { OrderStatus } from '../enums/order-status.enum';
// --------------------------------------------------------
import { Service } from './service.entity';

// ... (Resto de las clases PostMeta y Product igual que antes)

@ObjectType()
export class PostMeta {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  postId: number;

  @Field(() => String)
  key: string;

  @Field(() => String)
  value: string;
}

@ObjectType()
export class Product {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Float, { nullable: true })
  netAmount?: number;

  @Field(() => Float, { nullable: true })
  commission?: number;

  @Field(() => Int, { nullable: true })
  serviceId?: number;

  @Field(() => Service, { nullable: true })
  service?: Service;

  @Field(() => [PostMeta], { nullable: 'itemsAndList' })
  postmeta?: PostMeta[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
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

  @Field(() => OrderStatus) // Ahora usa el enum registrado
  status: OrderStatus;

  @Field(() => Float)
  total: number;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

@InputType()
export class CreateOrderInput {
  @Field(() => String)
  productId: string;
}
