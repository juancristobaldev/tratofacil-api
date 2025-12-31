import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { Role } from '@prisma/client';

@ObjectType()
export class UserMeta {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field()
  key: string;

  @Field()
  value: string;
}

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  displayName: string;

  @Field(() => Role, { nullable: true })
  role?: Role;

  @Field(() => Boolean, { nullable: true })
  isEmailVerified?: boolean;

  @Field(() => [UserMeta], { nullable: 'itemsAndList' })
  usermeta?: UserMeta[];

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@InputType()
export class RegisterInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field(() => Role, { nullable: true, defaultValue: Role.CLIENT })
  role?: Role;

  @Field({ nullable: true })
  phone?: string; // Este campo se guardará en wp_usermeta como 'billing_phone'
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  password?: string;
}
