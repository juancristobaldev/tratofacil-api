import { Module } from '@nestjs/common';
import { JobsInstaService } from './jobs-insta.service';
import { JobsInstaResolver } from './jobs-insta.resolver';

@Module({
  providers: [JobsInstaService, JobsInstaResolver]
})
export class JobsInstaModule {}
