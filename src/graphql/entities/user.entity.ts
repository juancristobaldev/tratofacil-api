import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsInt,
} from 'class-validator';
// -------------------------------------------------------------------------
// CORRECCIÓN: Importamos el Enum desde el archivo local, NO de Prisma
// -------------------------------------------------------------------------
import { Role } from '../enums/role.enum';
import { Provider } from './provider.entity';

@ObjectType()
export class UserMeta {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => String, { nullable: true })
  key?: string;

  @Field(() => String, { nullable: true })
  value?: string;
}

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  username: string;

  @Field(() => String)
  email: string;

  @Field(() => String, { nullable: true })
  displayName?: string;

  @Field(() => Role, { nullable: true })
  role?: Role;

  // Nota: isEmailVerified no existe nativamente en wp_users,
  // se suele manejar vía usermeta si es necesario. Lo dejo opcional.
  @Field(() => Boolean, { nullable: true })
  isEmailVerified?: boolean;

  @Field(() => [UserMeta], { nullable: 'itemsAndList' })
  usermeta?: UserMeta[];

  @Field(() => Provider, { nullable: true })
  provider?: Provider;

  // ALINEACIÓN: En WP la columna es 'user_registered', en el schema lo llamamos 'registered'
  @Field(() => Date)
  registered: Date;
}

@InputType()
export class RegisterInput {
  @Field(() => String)
  @IsEmail()
  email: string;

  @Field(() => String)
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  username?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field(() => Role, { nullable: true, defaultValue: Role.CLIENT })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
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
