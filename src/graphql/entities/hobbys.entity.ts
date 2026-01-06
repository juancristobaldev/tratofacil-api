import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateHobbyInput {
  @Field()
  @IsNotEmpty({ message: 'El nombre del hobby es obligatorio' })
  @IsString()
  name: string;

  @Field(() => Int)
  @IsNotEmpty()
  @IsInt()
  providerId: number;
}

@InputType()
export class DeleteHobbyInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  id: number;
}

@InputType()
export class UpdateHobbyInput extends PartialType(CreateHobbyInput) {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  id: number;
}
