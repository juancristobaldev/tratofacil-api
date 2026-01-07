import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsInt,
  IsUrl,
  IsBoolean,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { User } from './user.entity';
import { Order } from './order.entity';
import { ServiceProvider } from './service.entity';

// =========================================================
// 1. BANK ACCOUNT ENTITY
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

  @Field(() => String, { nullable: true })
  rut?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => Int)
  providerId: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// =========================================================
// 2. PROVIDER REVIEW ENTITY
// =========================================================
@ObjectType()
export class ProviderReview {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  providerId: number;

  @Field(() => Int)
  clientId: number;

  @Field(() => Int, { nullable: true })
  orderId?: number;

  @Field(() => Int)
  rating: number;

  @Field(() => String, { nullable: true })
  comment?: string;

  @Field(() => Date)
  createdAt: Date;

  // =======================
  // RELACIONES (Lazy loading o Directas)
  // =======================

  @Field(() => User)
  client: User;

  // Es vital que sea nullable: true si una review pudiera existir sin orden
  // (aunque en tu flujo siempre van juntas)
  @Field(() => Order, { nullable: true })
  order?: Order;
}

@InputType()
export class CreateReviewInput {
  @Field(() => Int)
  orderId: number;

  @Field(() => Int)
  providerId: number;

  @Field(() => Int)
  rating: number;

  @Field({ nullable: true })
  comment?: string;
}
// =========================================================
// 3. PROVIDER CERTIFICATE ENTITY
// =========================================================

@ObjectType()
export class ProviderType {
  @Field(() => Int)
  id: number;
  @Field()
  name: string;
  @Field(() => User, { nullable: true })
  user: User;
}

@ObjectType()
export class ProviderCertificate {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  providerId: number;

  @Field(() => ProviderType, { nullable: true })
  provider?: ProviderType;

  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  institution?: string | null;

  @Field(() => Int, { nullable: true })
  year?: number | null;

  @Field()
  fileUrl: string;

  @Field()
  verified: boolean;

  @Field()
  createdAt: Date;
}

@InputType()
export class CreateCertificateInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  institution?: string;

  @Field(() => Int, { nullable: true })
  year?: number;

  @Field()
  fileUrl: string;
}

@InputType()
export class UpdateCertificateInput {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  institution?: string;

  @Field(() => Int, { nullable: true })
  year?: number;

  @Field({ nullable: true })
  fileUrl?: string;
}

@ObjectType()
export class Hobby {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;
}
// =========================================================
// 4. MAIN PROVIDER ENTITY
// =========================================================
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

  @Field(() => String, { nullable: true })
  location?: string | null;

  @Field(() => String, { nullable: true })
  logoUrl?: string | null;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // RELACIONES (PRISMA)
  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => BankAccount, { nullable: true })
  bank?: BankAccount | null;

  @Field(() => [ProviderReview], { nullable: 'itemsAndList' })
  reviews?: ProviderReview[];

  @Field(() => [ProviderCertificate], { nullable: 'itemsAndList' })
  certificates?: ProviderCertificate[];

  @Field(() => [ServiceProvider], { nullable: 'itemsAndList' })
  services?: ServiceProvider[];

  @Field(() => [Hobby], { nullable: true })
  hobbys?: Hobby[];
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

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  rut?: string;

  @Field({ nullable: true })
  @IsOptional()
  email?: string;
}

@InputType()
export class CreateProviderInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'Rut personal' })
  @IsString()
  rut: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  company?: string;

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
export class UpdateProviderInput {
  @Field(() => Int, { nullable: true })
  @IsInt()
  id?: number;

  @Field({ nullable: true })
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  rut?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  company?: string;

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
