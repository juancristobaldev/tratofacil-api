import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { User } from './user.entity';

// =========================================================
// OUTPUTS
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

  // CORRECCIÓN AQUÍ: Agregamos '| null' para aceptar el valor de Prisma
  @Field({ nullable: true })
  rut?: string | null;

  @Field({ nullable: true })
  email?: string | null;
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

  @Field({ nullable: true })
  location?: string | null;

  @Field({ nullable: true })
  logoUrl?: string | null;

  @Field({ nullable: true })
  bio?: string | null;

  @Field({ nullable: true })
  phone?: string | null;

  @Field(() => BankAccount, { nullable: true })
  bank?: BankAccount | null;

  @Field(() => User)
  user?: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// =========================================================
// INPUTS (Sin cambios)
// =========================================================

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

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  rut?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  email?: string;
}

@InputType()
export class CreateProviderInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
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
