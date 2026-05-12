import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { SkillController } from './skill.controller.js';
import { SkillService } from './skill.service.js';

@Module({
  controllers: [SkillController],
  imports: [ProfileModule],
  providers: [SkillService],
})
export class SkillModule {}
