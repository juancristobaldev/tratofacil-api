import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { User } from './user.entity';

/**
 * @ObjectType - Respuesta de autenticación exitosa
 */
@ObjectType()
export class AuthType {
  @Field(() => String, { description: 'Token JWT para sesiones autorizadas' })
  accessToken: string;

  @Field(() => User, { description: 'Información del usuario autenticado' })
  user: User;
}

/**
 * @InputType - Credenciales para inicio de sesión
 */
@InputType()
export class LoginInput {
  @Field(() => String)
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  email: string;

  @Field(() => String)
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @IsString()
  password: string;
}

/**
 * @InputType - Datos necesarios para solicitar recuperación de contraseña
 * (Agregado para completar el flujo de Auth)
 */
@InputType()
export class ForgotPasswordInput {
  @Field(() => String)
  @IsEmail()
  email: string;
}
