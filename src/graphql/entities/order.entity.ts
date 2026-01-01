import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentProvider } from '../enums/payment-provider.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { User } from './user.entity';

// =========================================================
// 1. ENTIDAD PAYMENT (Mapeo Payment)
// =========================================================
@ObjectType()
export class Payment {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  orderId: number;

  @Field(() => Float)
  amount: number;

  @Field(() => PaymentProvider)
  provider: PaymentProvider;

  @Field(() => PaymentStatus)
  status: PaymentStatus;

  @Field({ nullable: true })
  transactionId?: string; // Token de Webpay o ID de transferencia

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// =========================================================
// 2. ENTIDAD ORDER (Mapeo Order)
// =========================================================
@ObjectType()
export class Order {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  clientId: number;

  @Field(() => Float)
  total: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Int, { nullable: true })
  wcOrderId?: number; // Referencia al pedido real en WooCommerce

  @Field({ nullable: true })
  wcOrderKey?: string; // Clave para checkout externo si fuera necesario

  @Field(() => User)
  client: User;

  @Field(() => Payment, { nullable: true })
  payment?: Payment;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// =========================================================
// 3. INPUTS PARA CARRITO Y ORDEN
// =========================================================
@InputType()
export class OrderItemInput {
  @Field(() => Int)
  @IsInt()
  serviceId: number; // ID del WpPost (Producto)

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;
}

@InputType()
export class CreateOrderInput {
  @Field(() => [OrderItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];

  // El total se calcula en el Backend por seguridad, pero podrías
  // enviarlo para validación cruzada.
}

// =========================================================
// 4. ENTIDAD DE RESPUESTA WEBPAY (Helper)
// =========================================================
@ObjectType()
export class WebpayResponse {
  @Field()
  token: string;

  @Field()
  url: string;
}
