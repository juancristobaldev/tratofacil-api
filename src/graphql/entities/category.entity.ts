import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { Service } from './service.entity'; // Importación asumiendo que existe el archivo

@ObjectType()
export class Category {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int, { nullable: true })
  parentId?: number;

  // Relación con servicios (subcategorías en WordPress)
  @Field(() => [Service], { nullable: 'itemsAndList' })
  services?: Service[];
}

@InputType()
export class CreateCategoryInput {
  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int, { nullable: true })
  parentId?: number;
}

@InputType()
export class UpdateCategoryInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  description?: string;
}
