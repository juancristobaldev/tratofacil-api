import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
// -------------------------------------------------------------------------
// ERROR AQUÍ: No importes de '@prisma/client'.
// SOLUCIÓN: Importa desde tu archivo local donde hiciste el registerEnumType
// -------------------------------------------------------------------------
import { Role } from '../enums/role.enum';
// -------------------------------------------------------------------------
import { IsEmail, IsOptional, IsString, IsInt } from 'class-validator';

@ObjectType()
export class UserMeta {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => String)
  key: string;

  @Field(() => String)
  value: string;
}

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  username: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  displayName: string;

  // Ahora NestJS sabe que este 'Role' es el Enum registrado
  @Field(() => Role, { nullable: true })
  role: Role | null;

  @Field(() => Boolean, { nullable: true })
  isEmailVerified: boolean | null;

  @Field(() => [UserMeta], { nullable: 'itemsAndList' })
  usermeta?: UserMeta[];

  @Field(() => Date, { nullable: true })
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  updatedAt: Date | null;
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
