import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
export class AuthType {
  @Field(() => String)
  accessToken: string;

  @Field(() => User)
  user: User;
}

@InputType()
export class LoginInput {
  @Field()
  email: string;

  @Field()
  password: string;
}
