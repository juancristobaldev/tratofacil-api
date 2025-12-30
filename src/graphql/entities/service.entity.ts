import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Provider } from './provider.entity';
import { Category } from './category.entity';


@ObjectType()
export class ServiceProvider {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Float)
  price: number;

  @Field(() => Float)
  commission: number;
  @Field()
  location: string;
  @Field(() => Float)
  netAmount: number;
}
@ObjectType()
export class ServiceDetail {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Float)
  price: number;

  @Field(() => Float)
  commission: number;

  @Field(() => Float)
  netAmount: number;

  @Field()
  hasHomeVisit: boolean;

  // 👇 UN provider específico
  @Field(() => Provider)
  provider: Provider;
}

@ObjectType()
export class Service {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Float,{nullable:true})
  price?: number;

  @Field(() => Float,{nullable:true})
  commission?: number;

  @Field(() => Float,{nullable:true})
  netAmount?: number;

  @Field()
  hasHomeVisit: boolean;

  // Cambiado a ServiceProvider[]
  @Field(() => [ServiceProvider], { nullable: true })
  providers?: ServiceProvider[];

  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field()
  createdAt: Date;
}
