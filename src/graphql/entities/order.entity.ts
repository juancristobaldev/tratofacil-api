import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import { IsInt, Min } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';
import { User } from './user.entity';
import { Payment } from './payment.entity';
import { ProviderReview } from './provider.entity';
import { Service } from './service.entity'; // Importación necesaria

@ObjectType()
export class OrderProduct {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;
}

@ObjectType()
export class Order {
  // =========================
  // IDENTIDAD
  // =========================
  @Field(() => Int)
  id: number;

  // =========================
  // CLIENTE
  // =========================
  @Field(() => Int)
  clientId: number;

  @Field(() => User)
  client: User;

  // =========================
  // DATOS DE LA ORDEN
  // =========================
  @Field(() => Float)
  total: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  // =========================
  // VINCULACIÓN WOOCOMMERCE
  // =========================
  @Field(() => Int, { nullable: true })
  wcOrderId?: number | null;

  @Field(() => String, { nullable: true })
  wcOrderKey?: string | null;

  @Field(() => Int, { nullable: true })
  productId?: number | null;

  // RELACIÓN PRODUCTO (SERVICIO)
  // Esta relación existía en Prisma pero faltaba aquí
  @Field(() => OrderProduct, { nullable: true })
  product?: OrderProduct | null;

  // =========================
  // RELACIONES
  // =========================
  @Field(() => Payment, { nullable: true })
  payment?: Payment | null;

  @Field(() => ProviderReview, { nullable: true })
  review?: ProviderReview | null;

  // =========================
  // TIMESTAMPS
  // =========================
  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

/* ======================
   INPUTS
====================== */

@InputType()
export class OrderItemInput {
  @Field(() => Int)
  @IsInt()
  serviceId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;
}

@InputType()
export class CreateOrderInput {
  @Field(() => Int)
  productId: number;
}

@ObjectType()
export class WebpayResponse {
  @Field()
  token: string;

  @Field()
  url: string;
}
