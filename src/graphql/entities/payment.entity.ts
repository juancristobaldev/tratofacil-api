import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Order } from './order.entity';

@ObjectType()
export class Payment {
  @Field(() => ID)
  id: string;

  @Field(() => Order)
  order: Order;

  @Field(() => Float)
  amount: number;

  @Field()
  provider: 'WEBPAY' | 'MERCADOPAGO';

  @Field()
  status: 'INITIATED' | 'CONFIRMED' | 'FAILED';

  @Field()
  createdAt: Date;
}
