import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUrl,
  IsInt,
  IsEmail,
  Length,
} from 'class-validator';
import { User } from './user.entity';
import { Service } from './service.entity';

// =========================================================
// 1. ENTIDAD BANK ACCOUNT (Mapeo BankAccount)
// =========================================================
@ObjectType()
export class BankAccount {
  @Field(() => Int)
  id: number;

  @Field()
  bankName: string;

  @Field()
  accountNumber: string;

  @Field()
  accountType: string;

  @Field({ nullable: true })
  rut?: string;

  @Field({ nullable: true })
  email?: string;

  @Field(() => Int)
  providerId: number;
}

// =========================================================
// 2. ENTIDAD PROVIDER (Mapeo Provider)
// =========================================================
@ObjectType()
export class Provider {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => Int, { nullable: true })
  wcCategoryId?: number; // ID de la categoría espejo en WooCommerce

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => BankAccount, { nullable: true })
  bank?: BankAccount;

  @Field(() => User)
  user: User;

  @Field(() => [Service], { nullable: 'itemsAndList' })
  services?: Service[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// =========================================================
// 3. INPUT: CREAR PROVEEDOR
// =========================================================
@InputType()
export class CreateProviderInput {
  @Field()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  name: string;

  @Field()
  @IsNotEmpty({ message: 'La ubicación es obligatoria' })
  @IsString()
  location: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'El logo debe ser una URL válida' })
  logoUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(9, 15)
  phone?: string;

  // El userId se obtiene del contexto (usuario autenticado)
}

// =========================================================
// 4. INPUT: ACTUALIZAR PROVEEDOR
// =========================================================
@InputType()
export class UpdateProviderInput {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;

  @Field({ nullable: true })
  @IsOptional()
  logoUrl?: string;
}

// =========================================================
// 5. INPUT: GESTIONAR CUENTA BANCARIA
// =========================================================
@InputType()
export class UpdateBankInput {
  @Field()
  @IsNotEmpty()
  bankName: string;

  @Field()
  @IsNotEmpty()
  accountNumber: string;

  @Field()
  @IsNotEmpty()
  accountType: string;

  @Field({ nullable: true })
  @IsOptional()
  rut?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;
}
