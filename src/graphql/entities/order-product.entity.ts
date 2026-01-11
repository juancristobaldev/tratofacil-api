import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import { IsInt, Min, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentProvider } from '../enums/payment-provider.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { User } from './user.entity';
import { Provider } from './provider.entity';
import { Product } from './product.entity'; // Importante para la coherencia
import { PaymentProduct } from './payment.entity';
import { ShippingInfo } from './shipping.entity';

/**
 * ENTIDAD PAGO DE PRODUCTO
 * Alineada con el modelo 'PaymentProduct' de Prisma.
 */

/**
 * ENTIDAD ORDEN DE PRODUCTO
 * Alineada con el modelo 'OrderProduct' de Prisma.
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

  @Field(() => Float)
  commission: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => String, {
    nullable: true,
    description: 'Empresa de transporte encargada del envío',
  })
  shippingCompany?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Código de seguimiento del paquete',
  })
  trackingCode?: string;

  // RELACIONES (Uso de funciones de flecha para evitar fallos de circularidad)
  @Field(() => User, { description: 'Cliente que realizó la compra' })
  client: User;

  @Field(() => ShippingInfo, { description: 'Datos de envio' })
  shippingInfo: ShippingInfo;

  @Field(() => Provider, { description: 'Vendedor del producto' })
  provider: Provider;

  @Field(() => Product, { description: 'Producto físico adquirido' })
  product: Product;

  @Field(() => PaymentProduct, {
    nullable: true,
    description: 'Información del pago asociado',
  })
  payment?: PaymentProduct | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class UpdateShippingInput {
  @Field(() => Int)
  orderId: number;

  @Field(() => String)
  shippingCompany: string;

  @Field(() => String)
  trackingCode: string;
}
/**
 * INPUT PARA CREAR UNA ORDEN
 */
@InputType()
export class CreateOrderProductInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;
}

/**
 * RESPUESTA PARA MUTACIONES DE COMPRA
 */
@ObjectType()
export class OrderProductWithPaymentResponse {
  @Field(() => OrderProduct)
  order: OrderProduct;

  @Field(() => PaymentProduct)
  payment: PaymentProduct;
}
