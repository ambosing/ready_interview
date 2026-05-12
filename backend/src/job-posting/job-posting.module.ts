import { Module } from '@nestjs/common';
import { JobPostingController } from './job-posting.controller.js';
import { JobPostingService } from './job-posting.service.js';

@Module({
  controllers: [JobPostingController],
  providers: [JobPostingService],
})
export class JobPostingModule {}
