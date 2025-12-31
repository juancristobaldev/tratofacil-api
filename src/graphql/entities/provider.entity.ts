import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { User } from './user.entity';
import { IsOptional, IsString } from 'class-validator';
import { Service } from './service.entity';

@ObjectType()
export class BankAccount {
  @Field(() => Int) // Coherente con Int @id @default(autoincrement())
  id: number;

  @Field()
  bankName: string;

  @Field()
  accountNumber: string;

  @Field()
  accountType: string;

  @Field(() => Int)
  providerId: number;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@ObjectType()
export class Provider {
  @Field(() => Int) // Coherente con Int @id @default(autoincrement())
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field(() => Int)
  userId: number;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => BankAccount, { nullable: true })
  bank?: BankAccount;

  @Field(() => [Service], { nullable: 'itemsAndList' })
  services?: Service[];

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@InputType()
export class UpdateProviderInput {
  @Field(() => Int) // Prisma usa Int para buscar por ID
  providerId: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

@InputType()
export class UpdateBankInput {
  @Field(() => Int)
  bankId: number;

  @Field({ nullable: true })
  @IsOptional()
  bankName?: string;

  @Field({ nullable: true })
  @IsOptional()
  accountNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  accountType?: string;
}
