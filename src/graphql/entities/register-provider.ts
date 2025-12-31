import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

@InputType()
export class CredentialsInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(6)
  password: string;
}

@InputType()
export class IdentityInput {
  @Field()
  @IsNotEmpty()
  firstName: string; // Se guardará en UserMeta como 'first_name'

  @Field()
  @IsNotEmpty()
  lastName: string; // Se guardará en UserMeta como 'last_name'

  @Field()
  @IsNotEmpty()
  rut: string; // Se guardará en UserMeta como 'rut'

  @Field()
  @IsNotEmpty()
  phone: string; // Se guardará en UserMeta como 'billing_phone'
}

@InputType()
export class BankInput {
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

@InputType()
export class ServicesInput {
  @Field(() => [String])
  categories: string[]; // Slugs de los 'Service' (wp_terms) que ofrece
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
  providerName?: string; // Nombre comercial del proveedor
}
