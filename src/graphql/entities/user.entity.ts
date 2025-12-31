import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { IsEmail, IsOptional, IsString, IsInt } from 'class-validator';

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

  // Cambiamos 'role?: Role' por 'role: Role | null'
  // Esto permite que el valor null de la DB sea aceptado por TypeScript
  @Field(() => Role, { nullable: true })
  role: Role | null;

  @Field(() => Boolean, { nullable: true })
  isEmailVerified: boolean | null;

  @Field(() => [UserMeta], { nullable: 'itemsAndList' })
  usermeta?: UserMeta[];

  @Field({ nullable: true })
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt: Date | null;
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
  @Field(() => Int)
  @IsInt()
  id: number; // Coincide con wp_users.ID (Int)

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string; // Se procesará hacia wp_usermeta
}
