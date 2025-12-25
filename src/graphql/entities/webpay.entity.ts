import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class WebpayResponse {
  @Field()
  token: string;

  @Field()
  url: string;
}