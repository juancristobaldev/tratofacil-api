import { ObjectType, Field } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
export class AuthType {
  @Field(() => String)
  accessToken: string;

  @Field(() => User)
  user: User;
}