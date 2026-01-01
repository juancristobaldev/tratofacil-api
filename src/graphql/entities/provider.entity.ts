import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';
import { User } from './user.entity';
import { Service } from './service.entity';

@ObjectType()
export class BankAccount {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  bankName: string;

  @Field(() => String)
  accountNumber: string;

  @Field(() => String)
  accountType: string;

  @Field(() => String, { nullable: true })
  rut?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => Int)
  providerId: number;
}

@ObjectType()
export class Provider {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  slug: string;

  @Field(() => String, { nullable: true })
  location?: string;

  @Field(() => String, { nullable: true })
  logoUrl?: string;

  @Field(() => String, { nullable: true })
  bio?: string;

  @Field(() => String, { nullable: true })
  phone?: string;

  @Field(() => Int)
  userId: number;

  @Field(() => User)
  user: User;

  @Field(() => BankAccount, { nullable: true })
  bank?: BankAccount;

  @Field(() => [Service], { nullable: 'itemsAndList' })
  services?: Service[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@InputType()
export class CreateProviderInput {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  location: string;

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
}

@InputType()
export class UpdateProviderInput {
  @Field(() => Int)
  @IsInt()
  providerId: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

@InputType()
export class UpdateBankInput {
  @Field(() => Int)
  @IsInt()
  bankId: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  bankName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  accountNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  accountType?: string;
}
