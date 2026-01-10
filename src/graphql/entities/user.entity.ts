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
  IsOptional,
  IsEnum,
  MinLength,
  IsUrl,
  IsInt,
} from 'class-validator';
import { Role } from '../enums/role.enum';
import { Provider } from './provider.entity';
import { Order } from './order.entity';
import { ProviderReview } from './provider.entity';
import { OrderProduct } from './order-product.entity';
import { OrderJob } from './order-job.entity';

/**
 * ENTIDAD USER (Output Object Type)
 * Alineada con el modelo 'User' de Prisma.
 */

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
  phone: string;
  @Field()
  url: string;

  @Field(() => Int)
  status: number;

  @Field()
  registered: Date;

  @Field()
  activationKey: string;

  // CAMBIO CLAVE: Definir el tipo de forma que acepte el string del Enum de Prisma
  @Field(() => Role, { nullable: true })
  role?: Role | string | null;

  @Field(() => Provider, { nullable: true })
  provider?: Provider | null;

  @Field(() => [Order], { nullable: 'itemsAndList' })
  orders?: Order[];
  @Field(() => [OrderJob], { nullable: 'itemsAndList' })
  jobOrders?: OrderJob[];
  @Field(() => [ProviderReview], { nullable: 'itemsAndList' })
  reviews?: ProviderReview[];
  @Field(() => [OrderProduct], { nullable: true })
  productOrders?: OrderProduct[];
}
/**
 * INPUT PARA REGISTRO DE USUARIO (Básico)
 */
@InputType()
export class RegisterUserInput {
  @Field()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty()
  email: string;

  @Field()
  @IsNotEmpty()
  phone: string;

  @Field()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  username?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field(() => Role, { defaultValue: Role.CLIENT })
  @IsEnum(Role)
  role: Role;
}

/**
 * INPUT PARA ACTUALIZACIÓN DE PERFIL
 */
@InputType()
export class UpdateUserInput {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field()
  @IsNotEmpty()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'La URL debe ser un formato válido' })
  url?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nicename?: string;
}

/**
 * INPUT PARA CAMBIO DE CONTRASEÑA
 */
@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  oldPassword: string;

  @Field()
  @IsString()
  @MinLength(8)
  newPassword: string;
}
