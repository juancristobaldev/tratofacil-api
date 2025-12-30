import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { User } from './user.entity';
import { Service } from './service.entity';
import { IsNotEmpty } from 'class-validator';

@ObjectType()
export class BankAccount {
  @Field(() => ID)
  id: string;

  @Field()
  bankName: string;

  @Field()
  accountNumber: string;

  @Field()
  accountType: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Provider {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  location: string;

  @Field(() => String, { nullable: true })
  logoUrl?: string;

  @Field(() => BankAccount,{nullable:true})
  bank?: BankAccount;

  @Field(() => [Service], {nullable:true})
  services?: Service[];
}

@InputType()
export class UpdateProviderInput {
  @Field(() => ID)
  providerId: string;

  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  location: string;
}

// src/modules/bank/dto/update-bank.input.ts

@InputType()
export class UpdateBankInput {
  @Field(() => ID)
  bankId: string;

  @Field()
  @IsNotEmpty()
  bankName: string;

  @Field()
  @IsNotEmpty()
  accountNumber: string;

  @Field()
  @IsNotEmpty()
  accountType: string;
}