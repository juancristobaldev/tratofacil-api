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

// Registro del Enum Role para GraphQL
registerEnumType(Role, { name: 'Role' });

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
  url: string;

  @Field(() => Int)
  status: number;

  @Field()
  registered: Date;

  @Field()
  activationKey: string;

  @Field(() => Role, { nullable: true })
  role?: Role | null;

  // RELACIONES
  @Field(() => Provider, {
    nullable: true,
    description: 'Perfil de proveedor si el usuario tiene uno',
  })
  provider?: Provider | null;

  @Field(() => [Order], {
    nullable: 'itemsAndList',
    description: 'Historial de órdenes del usuario',
  })
  orders?: Order[];

  @Field(() => [ProviderReview], {
    nullable: 'itemsAndList',
    description: 'Reseñas escritas por el usuario',
  })
  reviews?: ProviderReview[];
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
