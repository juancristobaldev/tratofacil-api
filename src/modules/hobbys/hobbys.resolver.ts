import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';

import { HobbyService } from './hobbys.service';
import { Hobby } from 'src/graphql/entities/provider.entity';
import {
  CreateHobbyInput,
  DeleteHobbyInput,
} from 'src/graphql/entities/hobbys.entity';

@Resolver(() => Hobby)
export class HobbyResolver {
  constructor(private readonly hobbyService: HobbyService) {}

  // =========================================================
  // MUTATIONS
  // =========================================================

  @Mutation(() => Hobby, { name: 'createHobby' })
  async createHobby(
    @Args('createHobbyInput') createHobbyInput: CreateHobbyInput,
  ) {
    return this.hobbyService.create(createHobbyInput);
  }

  @Mutation(() => Hobby, { name: 'deleteHobby' })
  async deleteHobby(
    @Args('deleteHobbyInput') deleteHobbyInput: DeleteHobbyInput,
  ) {
    return this.hobbyService.remove(deleteHobbyInput.id);
  }

  // =========================================================
  // QUERIES
  // =========================================================

  @Query(() => [Hobby], { name: 'hobbies' })
  async findAll() {
    return this.hobbyService.findAll();
  }

  @Query(() => Hobby, { name: 'hobby' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.hobbyService.findOne(id);
  }

  @Query(() => [Hobby], { name: 'hobbiesByProvider' })
  async findByProvider(
    @Args('providerId', { type: () => Int }) providerId: number,
  ) {
    return this.hobbyService.findByProvider(providerId);
  }
}
