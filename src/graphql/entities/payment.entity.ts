import {
  ObjectType,
  Field,
  Int,
  Float,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { PaymentProvider } from '../enums/payment-provider.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Order } from './order.entity';
import { OrderProduct } from './order-product.entity';

// Registro de Enums para GraphQL (si no se han registrado en un archivo central)
registerEnumType(PaymentProvider, { name: 'PaymentProvider' });
registerEnumType(PaymentStatus, { name: 'PaymentStatus' });

@ObjectType()
export class PaymentProduct {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  orderProductId: number;

  @Field(() => Float)
  amount: number;

  @Field(() => PaymentProvider)
  provider: PaymentProvider;

  @Field(() => PaymentStatus)
  status: PaymentStatus;

  @Field(() => String, { nullable: true })
  transactionId?: string | null;

  // RELACIÓN DE RETORNO (Coherencia con Prisma)
  @Field(() => OrderProduct)
  orderProduct: OrderProduct;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
/**
 * ENTIDAD PAYMENT (Output Object Type)
 * Alineada con el modelo 'Payment' de Prisma.
 */
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

  @Field(() => String, { nullable: true })
  transactionId?: string | null;

  // RELACIONES
  @Field(() => Order, { description: 'Orden asociada a este pago' })
  order: Order;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

/**
 * INPUT PARA CREAR UN PAGO
 */
@InputType()
export class CreatePaymentInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  orderId: number;

  @Field(() => Float)
  @IsNumber()
  @MinLength(1) // Opcional: validación de monto mínimo
  amount: number;

  @Field(() => PaymentProvider)
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  transactionId?: string;
}

/**
 * INPUT PARA ACTUALIZAR ESTADO DE PAGO (Webhook / Callback)
 */
@InputType()
export class UpdatePaymentStatusInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @Field(() => PaymentStatus)
  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}
