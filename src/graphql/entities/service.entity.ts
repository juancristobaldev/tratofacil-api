import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Provider } from './provider.entity';
import { Category } from './category.entity';

@ObjectType()
export class Service {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Float)
  price: number;

  // comisión calculada
  @Field(() => Float)
  commission: number;

  @Field(() => Float)
  netAmount: number;

  @Field()
  hasHomeVisit: boolean;

  @Field(() => Provider)
  provider: Provider;

  @Field(() => Category)
  category: Category;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ServiceEntity {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Float)
  price: number;

  @Field(() => Float)
  commission: number;

  @Field(() => Float)
  netAmount: number;
}