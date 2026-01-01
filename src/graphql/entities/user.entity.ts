import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
// -------------------------------------------------------------------------
// ERROR AQUÍ: No importes de '@prisma/client'.
// SOLUCIÓN: Importa desde tu archivo local donde hiciste el registerEnumType
// -------------------------------------------------------------------------
import { Role } from '../enums/role.enum';
// -------------------------------------------------------------------------
import { IsEmail, IsOptional, IsString, IsInt } from 'class-validator';
import { Provider } from './provider.entity';

@ObjectType()
export class UserMeta {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => String, { nullable: true }) // Tipo explícito String
  key?: string | null;

  @Field(() => String, { nullable: true }) // Tipo explícito String
  value?: string | null;
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
  role?: Role | null;

  @Field(() => Boolean, { nullable: true }) // Tipo explícito Boolean
  isEmailVerified?: boolean | null;

  @Field(() => [UserMeta], { nullable: 'itemsAndList' })
  usermeta?: UserMeta[] | null;

  @Field(() => Provider, { nullable: true })
  provider?: Provider | null;

  @Field()
  createdAt: Date;

  @Field(() => Date, { nullable: true }) // Tipo explícito Date
  updatedAt?: Date | null;
}
@InputType()
export class RegisterInput {
  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;

  @Field(() => String, { nullable: true })
  username?: string;

  @Field(() => String, { nullable: true })
  displayName?: string;

  // Aquí también usa el Role importado correctamente
  @Field(() => Role, { nullable: true, defaultValue: Role.CLIENT })
  role?: Role;

  @Field(() => String, { nullable: true })
  phone?: string;
}

@InputType()
export class UpdateUserInput {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;
}
