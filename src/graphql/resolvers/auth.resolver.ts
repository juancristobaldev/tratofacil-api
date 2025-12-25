import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from 'src/modules/auth/auth.service';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

}