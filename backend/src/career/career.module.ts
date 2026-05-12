import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { CareerController } from './career.controller.js';
import { CareerService } from './career.service.js';

@Module({
  controllers: [CareerController],
  imports: [ProfileModule],
  providers: [CareerService],
})
export class CareerModule {}
