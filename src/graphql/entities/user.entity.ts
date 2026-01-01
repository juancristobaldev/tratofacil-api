import {
  ObjectType,
  Field,
  Int,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Provider } from './provider.entity';
import { Role } from '../enums/role.enum';

@ObjectType()
export class UserMeta {
  @Field(() => Int)
  umeta_id: number;

  @Field(() => Int)
  userId: number;

  @Field()
  key: string;

  // CORRECCIÓN: Añadimos '| null' para que acepte el valor de Prisma
  @Field({ nullable: true })
  value?: string | null;
}

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  displayName: string;

  @Field()
  nicename: string;

  @Field()
  url: string;

  @Field(() => Int)
  status: number;

  @Field()
  registered: Date;

  @Field()
  activationKey: string;

  @Field(() => Role, { nullable: true })
  role?: Role;

  @Field(() => [UserMeta], { nullable: 'itemsAndList' })
  usermeta?: UserMeta[];

  @Field(() => Provider, { nullable: true })
  provider?: Provider | null; // CORRECCIÓN: Provider también puede venir null
}

// --- INPUTS ---

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  username?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  displayName?: string;

  @Field(() => Role, { defaultValue: Role.CLIENT })
  @IsEnum(Role)
  role: Role;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;
}

@InputType()
export class UpdateUserInput {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;
}
