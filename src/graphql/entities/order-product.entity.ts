import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import { IsInt, Min, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';
import { User } from './user.entity';
import { Product } from './product.entity';
import { Payment } from './payment.entity';
import { PaymentProvider } from '@prisma/client';
import { PaymentStatus } from '../enums/payment-status.enum';

/**
 * ENTIDAD ORDER PRODUCT (Output Object Type)
 * Representa la compra de un producto físico en el Marketplace.
 */

@ObjectType()
export class OrderProduct {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  clientId: number;

  @Field(() => Int)
  productId: number;

  @Field(() => Int)
  providerId: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  total: number;

  @Field(() => Float, {
    description: 'Comisión calculada según el rango de precio',
  })
  commission: number;

  @Field(() => Float, { description: 'Monto líquido para el proveedor' })
  netAmount: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  // RELACIONES
  @Field(() => User, { description: 'Cliente que realizó la compra' })
  client?: User;

  @Field(() => Product, { description: 'Producto adquirido' })
  product?: Product;

  @Field(() => Payment, {
    nullable: true,
    description: 'Información del pago asociado',
  })
  payment?: Payment | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

/**
 * INPUT PARA CREAR UNA ORDEN DE PRODUCTO
 * Utilizado por el método createOrderProductWithPayment del servicio.
 */
@InputType()
export class CreateOrderProductInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1, { message: 'La cantidad mínima es 1 unidad' })
  quantity: number;

  // El total y las comisiones se calculan en el servidor para evitar manipulaciones
}

/**
 * INPUT PARA ACTUALIZAR ESTADO DE ORDEN DE PRODUCTO
 */
@InputType()
export class UpdateOrderProductInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  id: number;

  @Field(() => OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}

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

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class OrderProductWithPaymentResponse {
  @Field(() => OrderProduct)
  order: OrderProduct;

  @Field(() => PaymentProduct)
  payment: PaymentProduct;
}
