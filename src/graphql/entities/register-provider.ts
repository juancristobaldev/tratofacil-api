import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '../enums/role.enum';
import { BankAccountInput } from './provider.entity';

/**
 * INPUT PARA EL REGISTRO INTEGRAL DE PROVEEDOR
 * Este DTO permite crear el Usuario y el Perfil de Proveedor en un solo paso.
 */
@InputType()
export class RegisterProviderInput {
  // ==========================================
  // DATOS DE CUENTA (USER)
  // ==========================================
  @Field(() => String)
  @IsEmail({}, { message: 'El formato del correo es inválido' })
  @IsNotEmpty()
  email: string;

  @Field(() => String)
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  username?: string;

  // El rol siempre será PROVIDER para este flujo
  @Field(() => Role, { defaultValue: Role.PROVIDER })
  role: Role = Role.PROVIDER;

  // ==========================================
  // DATOS DE PERFIL (PROVIDER)
  // ==========================================
  @Field(() => String)
  @IsNotEmpty({ message: 'El nombre comercial o del proveedor es obligatorio' })
  @IsString()
  name: string;

  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  slug: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'El logo debe ser una URL válida' })
  logoUrl?: string;

  // ==========================================
  // DATOS BANCARIOS (BANK ACCOUNT)
  // ==========================================
  @Field(() => BankAccountInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankAccountInput)
  bank?: BankAccountInput;
}
