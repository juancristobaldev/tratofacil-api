import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsUrl,
  IsInt,
} from 'class-validator';
import { Role } from '../enums/role.enum';
import { Provider } from './provider.entity'; // Se asume que existe

// =========================================================
// 1. ENTIDAD USERMETA (Mapeo wp_usermeta)
// =========================================================
@ObjectType()
export class UserMeta {
  @Field(() => Int)
  umeta_id: number;

  @Field(() => Int)
  userId: number;

  @Field()
  key: string;

  @Field({ nullable: true })
  value?: string;
}

// =========================================================
// 2. ENTIDAD USER (Mapeo wp_users)
// =========================================================
@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field()
  username: string; // user_login

  @Field()
  email: string; // user_email

  @Field()
  nicename: string; // user_nicename

  @Field({ nullable: true })
  displayName: string; // display_name

  @Field()
  url: string; // user_url

  @Field()
  registered: Date; // user_registered

  @Field(() => Int)
  status: number; // user_status

  // Campo calculado: Se extrae de wp_usermeta (wp_capabilities)
  @Field(() => Role)
  role: Role;

  // Relaciones
  @Field(() => [UserMeta], { nullable: 'itemsAndList' })
  usermeta?: UserMeta[];

  @Field(() => Provider, { nullable: true })
  provider?: Provider;
}

// =========================================================
// 3. INPUT: REGISTRO
// =========================================================
@InputType()
export class RegisterInput {
  @Field()
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @Field()
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  username?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field(() => Role, { defaultValue: Role.CLIENT })
  @IsEnum(Role)
  role: Role;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string; // Se guardará en usermeta (billing_phone)
}

// =========================================================
// 4. INPUT: LOGIN
// =========================================================
@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  password: string;
}

// =========================================================
// 5. INPUT: ACTUALIZACIÓN DE PERFIL
// =========================================================
@InputType()
export class UpdateUserInput {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  url?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nicename?: string;
}
