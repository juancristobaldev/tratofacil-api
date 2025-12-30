import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional } from 'class-validator';
import { Provider } from './provider.entity';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  // Debes indicar explícitamente el tipo para campos opcionales
  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field()
  role: string;

  @Field()
  isEmailVerified: boolean;

  // Para Date, siempre usar (() => Date)
  @Field(() => Date)
  createdAt: Date;

  @Field(() => Provider,{ nullable: true })

  provider?: Provider;
}



@InputType()
export class UpdateUserInput {
  @Field(() => ID)
  userId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  lastName?: string;
  
}