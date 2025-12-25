import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../enums/role.enum'; // Asegúrate de que este path sea correcto según tu estructura

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  password: string;
}

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  // Opcional: si quieres permitir que se registren con un rol específico desde el front
  @Field(() => Role, { nullable: true })
  @IsOptional()
  role?: Role;
}