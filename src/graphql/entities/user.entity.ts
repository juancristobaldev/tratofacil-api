import { ObjectType, Field, ID } from '@nestjs/graphql';

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
}