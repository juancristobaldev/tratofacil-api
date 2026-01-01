import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { User } from './user.entity';
import { IsOptional, IsString } from 'class-validator';
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

  @Field(() => Int)
  providerId: number;

  @Field(() => Date, { nullable: true })
  createdAt: Date | null;

  @Field(() => Date, { nullable: true })
  updatedAt: Date | null;
}

@ObjectType()
export class Provider {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  location?: string;

  @Field(() => String, { nullable: true })
  logoUrl?: string;

  @Field(() => Int)
  userId: number;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => BankAccount, { nullable: true })
  bank?: BankAccount;

  @Field(() => [Service], { nullable: 'itemsAndList' })
  services?: Service[];

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

@InputType()
export class UpdateProviderInput {
  @Field(() => Int)
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
