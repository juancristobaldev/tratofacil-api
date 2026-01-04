import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import { IsInt, Min, IsOptional, IsNumber, isNotEmpty } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';
import { User } from './user.entity';
import { Payment } from './payment.entity';
import { ProviderReview } from './provider.entity';
import { ServiceProvider } from './service.entity';

/**
 * ENTIDAD ORDER (Output Object Type)
 * Alineada con el modelo 'Order' de Prisma.
 */
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

  // Integración con WooCommerce
  @Field(() => Int, { nullable: true })
  wcOrderId?: number | null;

  @Field(() => String, { nullable: true })
  wcOrderKey?: string | null;

  // Relación con el Proveedor de Servicio (La oferta)
  @Field(() => Int, { nullable: true })
  serviceProviderId?: number | null;

  // RELACIONES
  @Field(() => User, { description: 'Cliente que realizó la orden' })
  client: User;

  @Field(() => ServiceProvider, {
    nullable: true,
    description: 'Servicio específico contratado',
  })
  serviceProvider?: ServiceProvider | null;

  @Field(() => Payment, { nullable: true })
  payment?: Payment | null;

  @Field(() => ProviderReview, { nullable: true })
  review?: ProviderReview | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

/**
 * INPUT PARA CREAR UNA ORDEN
 */
@InputType()
export class CreateOrderInput {
  @Field(() => Int)
  @IsInt()
  serviceProviderId: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  total: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  wcOrderId?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  wcOrderKey?: string;
}

/**
 * INPUT PARA ACTUALIZAR ESTADO DE ORDEN
 */
@InputType()
export class UpdateOrderInput {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field(() => OrderStatus)
  status: OrderStatus;
}

/**
 * TIPO DE RESPUESTA PARA PASARELA DE PAGO (Webpay)
 */
@ObjectType()
export class WebpayResponse {
  @Field()
  token: string;

  @Field()
  url: string;
}
