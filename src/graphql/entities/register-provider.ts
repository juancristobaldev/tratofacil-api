import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

@InputType()
export class IdentityInput {
  @Field()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsNotEmpty()
  lastName: string;

  @Field()
  @IsNotEmpty()
  phone: string;
}

@InputType()
export class BankRegistrationInput {
  @Field()
  @IsString()
  bankName: string;

  @Field()
  @IsString()
  accountNumber: string;

  @Field()
  @IsString()
  accountType: string;
}

@InputType()
export class ProviderRegistrationInput {
  @Field(() => IdentityInput)
  identity: IdentityInput;

  @Field(() => BankRegistrationInput)
  bank: BankRegistrationInput;
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
