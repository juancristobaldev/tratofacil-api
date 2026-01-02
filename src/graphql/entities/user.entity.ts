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

// Registrar el Enum para que GraphQL lo entienda

@ObjectType()
export class UserMeta {
  @Field(() => Int)
  umeta_id: number;

  @Field(() => Int)
  userId: number;

  @Field()
  key: string;

  // CORRECCIÓN AQUÍ: Agregamos () => String explícito
  @Field(() => String, { nullable: true })
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

  // CORRECCIÓN: Agregamos () => Role explícito
  @Field(() => Role, { nullable: true })
  role?: Role;

  @Field(() => [UserMeta], { nullable: 'itemsAndList' })
  usermeta?: UserMeta[];

  // CORRECCIÓN: Agregamos () => Provider explícito
  @Field(() => Provider, { nullable: true })
  provider?: Provider | null;
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

  // CORRECCIÓN: Agregamos () => String explícito en opcionales
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  username?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  displayName?: string;

  @Field(() => Role, { defaultValue: Role.CLIENT })
  @IsEnum(Role)
  role: Role;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;
}

@InputType()
export class UpdateUserInput {
  @Field(() => Int)
  id: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;
}
