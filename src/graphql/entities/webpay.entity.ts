import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class WebpayResponse {
  @Field(() => String)
  token: string;

  @Field(() => String)
  url: string;
}
