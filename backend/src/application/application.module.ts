import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller.js';
import { ApplicationService } from './application.service.js';

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
})
export class ApplicationModule {}
