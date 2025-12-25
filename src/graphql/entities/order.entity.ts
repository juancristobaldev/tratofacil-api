import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { User } from './user.entity';
import { Service } from './service.entity';
import { OrderStatus } from '../enums/order-status.enum';

@ObjectType()
export class Order {
  @Field(() => ID)
  id: string;

  @Field(() => User)
  client: User;

  @Field(() => Service)
  service: Service;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Float)
  total: number;

  @Field()
  createdAt: Date;
}
