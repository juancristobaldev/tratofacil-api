import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Role } from '../enums/role.enum';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  // clientes informales
  @Field({ nullable: true })
  phone?: string;

  @Field(() => Role)
  role: Role;

  @Field()
  isEmailVerified: boolean;

  @Field()
  createdAt: Date;
}
