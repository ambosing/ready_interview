import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { EducationController } from './education.controller.js';
import { EducationService } from './education.service.js';

@Module({
  controllers: [EducationController],
  imports: [ProfileModule],
  providers: [EducationService],
})
export class EducationModule {}
