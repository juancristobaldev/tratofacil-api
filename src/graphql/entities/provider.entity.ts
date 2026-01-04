import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { User } from './user.entity';
import { Order } from './order.entity';

/* ======================
   OUTPUTS
====================== */

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

  @Field(() => String, { nullable: true })
  rut?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;
}

@ObjectType()
export class ProviderReview {
  // =========================
  // IDENTIDAD
  // =========================
  @Field(() => Int)
  id: number;

  // =========================
  // PROVIDER
  // =========================

  // =========================
  // CLIENTE
  // =========================
  @Field(() => Int)
  clientId: number;

  @Field(() => User)
  client: User;

  // =========================
  // ORDEN (REVIEW VERIFICADA)
  // =========================
  @Field(() => Int, { nullable: true })
  orderId?: number | null;

  @Field(() => Order, { nullable: true })
  order?: Order | null;

  // =========================
  // CONTENIDO DE LA REVIEW
  // =========================
  @Field(() => Int)
  rating: number; // 1 a 5

  @Field(() => String, { nullable: true })
  comment?: string | null;

  // =========================
  // TIMESTAMP
  // =========================
  @Field()
  createdAt: Date;
}

@ObjectType()
export class ProviderCertificate {
  // =========================
  // IDENTIDAD
  // =========================
  @Field(() => Int)
  id: number;

  // =========================
  // PROVIDER
  // =========================

  // =========================
  // DATOS DEL CERTIFICADO
  // =========================
  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  institution?: string | null;

  @Field(() => Int, { nullable: true })
  year?: number | null;

  @Field()
  fileUrl: string;

  // =========================
  // VERIFICACIÓN
  // =========================
  @Field()
  verified: boolean;

  // =========================
  // TIMESTAMP
  // =========================
  @Field()
  createdAt: Date;
}

@ObjectType()
export class Provider {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => Int, { nullable: true })
  wcCategoryId?: number | null;

  @Field()
  name: string;

  @Field()
  slug: string;
  @Field(() => [ProviderReview], { nullable: true })
  reviews?: ProviderReview[];
  @Field(() => [ProviderCertificate], { nullable: true })
  certificates?: ProviderCertificate[];

  @Field(() => String, { nullable: true })
  location?: string | null;

  @Field(() => String, { nullable: true })
  logoUrl?: string | null;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => BankAccount, { nullable: true })
  bank?: BankAccount | null;

  @Field(() => User, { nullable: true })
  user?: User | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// =========================================================
// PROVIDER REVIEW ENTITY
// =========================================================

/* ======================
   INPUTS
====================== */

@InputType()
export class BankAccountInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  bankName: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  accountType: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  rut?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  email?: string;
}

@InputType()
export class CreateProviderInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  location?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  logoUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  bio?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  phone?: string;

  @Field(() => BankAccountInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankAccountInput)
  bank?: BankAccountInput;
}

@InputType()
export class UpdateProviderInput extends CreateProviderInput {
  @Field(() => Int)
  id: number;
}
