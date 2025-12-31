import { ObjectType, Field, Int, Float, InputType } from '@nestjs/graphql';
import { PaymentProvider, PaymentStatus } from '@prisma/client'; // Importar Enums de Prisma
import { Order } from './order.entity';

@ObjectType()
export class Payment {
  @Field(() => Int) // Coherente con @id @default(autoincrement()) en Prisma
  id: number;

  @Field(() => Int)
  orderId: number;

  @Field(() => Order, { nullable: true })
  order?: Order;

  @Field(() => Float)
  amount: number;

  @Field(() => PaymentProvider) // Coherente con enum PaymentProvider { WEBPAY, MERCADOPAGO }
  provider: PaymentProvider;

  @Field(() => PaymentStatus) // Coherente con enum PaymentStatus { INITIATED, CONFIRMED, FAILED }
  status: PaymentStatus;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@InputType()
export class CreatePaymentInput {
  @Field()
  orderId: string; // Se convertirá a Number en el servicio

  @Field(() => Float)
  amount: number;

  @Field(() => PaymentProvider)
  provider: PaymentProvider;
}
