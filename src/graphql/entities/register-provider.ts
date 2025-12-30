// provider-registration.input.ts
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CredentialsInput {
  @Field() email: string;
  @Field() password: string;
}

@InputType()
export class IdentityInput {
  @Field() firstName: string;
  @Field() lastName: string;
  @Field() rut: string;
  @Field() phone: string;
}

@InputType()
export class BankInput {
  @Field() bankName: string;
  @Field() accountNumber: string;
  @Field() accountType: string;
}

@InputType()
export class ServicesInput {
  @Field(() => [String])
  categories: string[];
}

@InputType()
export class ProviderRegistrationInput {
  @Field(() => IdentityInput)
  identity: IdentityInput;


  @Field(() => BankInput)
  bank: BankInput;
}
