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

  // CORRECCIÓN: Se agrega () => String explícito
  @Field(() => String, { nullable: true })
  rut?: string | null;

  // CORRECCIÓN: Se agrega () => String explícito
  @Field(() => String, { nullable: true })
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

  // CORRECCIÓN: Agregamos () => String a todos los opcionales para evitar futuros errores
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
  user?: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// =========================================================
// INPUTS
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

  // CORRECCIÓN: También explícito en los Inputs por seguridad
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  rut?: string;

  @Field(() => String, { nullable: true })
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

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;

  @Field(() => String, { nullable: true })
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
