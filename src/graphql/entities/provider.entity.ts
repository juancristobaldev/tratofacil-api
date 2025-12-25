import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from './user.entity';
import { Service } from './service.entity';

@ObjectType()
export class Provider {
  @Field(() => ID)
  id: string;

  // relación 1–1 con User
  @Field(() => User)
  user: User;

  @Field()
  name: string;

  @Field()
  location: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field(() => [Service])
  services: Service[];

  @Field()
  createdAt: Date;
}
