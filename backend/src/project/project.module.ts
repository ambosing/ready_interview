import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { ProjectController } from './project.controller.js';
import { ProjectService } from './project.service.js';

@Module({
  controllers: [ProjectController],
  imports: [ProfileModule],
  providers: [ProjectService],
})
export class ProjectModule {}
