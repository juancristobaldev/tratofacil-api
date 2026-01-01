import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { User } from './user.entity';
import { IsOptional, IsString } from 'class-validator';
import { Service } from './service.entity';

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

  @Field(() => Int)
  providerId: number;

  @Field(() => Date, { nullable: true }) // Tipo explícito Date
  createdAt: Date | null;

  @Field(() => Date, { nullable: true }) // Tipo explícito Date
  updatedAt: Date | null;
}

@ObjectType()
export class Provider {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field(() => String, { nullable: true }) // Tipo explícito String
  location?: string | null;

  @Field(() => String, { nullable: true }) // Tipo explícito String
  logoUrl?: string | null;

  @Field(() => Int)
  userId: number;

  @Field(() => User, { nullable: true })
  user?: User | null;

  @Field(() => BankAccount, { nullable: true })
  bank?: BankAccount | null;

  @Field(() => [Service], { nullable: 'itemsAndList' })
  services?: Service[] | null;

  @Field(() => Date, { nullable: true }) // Tipo explícito Date
  createdAt?: Date | null;

  @Field(() => Date, { nullable: true }) // Tipo explícito Date
  updatedAt?: Date | null;
}

@InputType()
export class UpdateProviderInput {
  @Field(() => Int)
  providerId: number;

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
  logoUrl?: string;
}

@InputType()
export class UpdateBankInput {
  @Field(() => Int)
  bankId: number;

  @Field({ nullable: true })
  @IsOptional()
  bankName?: string;

  @Field({ nullable: true })
  @IsOptional()
  accountNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  accountType?: string;
}
