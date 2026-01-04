import { InputType, Field, Int } from '@nestjs/graphql';
import { CredentialsInput } from '../inputs/auth.input';
import { IsOptional } from 'class-validator';

@InputType()
export class IdentityInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  company: string;

  @Field()
  rut: string;

  @Field()
  phone: string;
}

@InputType()
export class BankInput {
  @Field()
  bankName: string;

  @Field()
  accountNumber: string;

  @Field()
  accountType: string;
}

@InputType()
export class ServicesInput {
  @Field(() => [String])
  categories: string[];
}

@InputType()
export class ProviderRegistrationInput {
  @Field(() => CredentialsInput)
  credentials: CredentialsInput;

  @Field(() => IdentityInput)
  identity: IdentityInput;

  @Field(() => BankInput)
  bank: BankInput;

  @Field(() => ServicesInput)
  services: ServicesInput;

  @Field({ nullable: true })
  providerName?: string;
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
