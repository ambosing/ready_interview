import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { SelfEvaluationController } from './self-evaluation.controller.js';
import { SelfEvaluationService } from './self-evaluation.service.js';

@Module({
  controllers: [SelfEvaluationController],
  imports: [ProfileModule],
  providers: [SelfEvaluationService],
})
export class SelfEvaluationModule {}
