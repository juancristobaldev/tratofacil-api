import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { IsEmail, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Provider } from './provider.entity';
import { Role } from '../enums/role.enum';

/* ======================
   ENTIDADES
====================== */

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

  @Field()
  nicename: string;

  @Field()
  url: string;

  @Field(() => Int)
  status: number;

  @Field()
  registered: Date;

  @Field()
  activationKey: string;

  @Field(() => Role, { nullable: true })
  role?: Role;

  @Field(() => Provider, { nullable: true })
  provider?: Provider | null;
}

/* ======================
   INPUTS
====================== */

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(8)
  password: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  username?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  displayName?: string;

  @Field(() => Role, { defaultValue: Role.CLIENT })
  @IsEnum(Role)
  role: Role;

  @Field(() => String, { nullable: true })
  @IsOptional()
  phone?: string;
}

@InputType()
export class UpdateUserInput {
  @Field(() => Int)
  id: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  displayName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  phone?: string;
}
