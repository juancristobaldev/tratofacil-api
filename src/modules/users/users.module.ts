import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
import { UsersResolver } from './users.resolver';

@Module({
  controllers: [UsersController],
  providers: [UserService, UsersResolver]
})
export class UsersModule {}
