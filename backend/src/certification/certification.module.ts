import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { CertificationController } from './certification.controller.js';
import { CertificationService } from './certification.service.js';

@Module({
  controllers: [CertificationController],
  imports: [ProfileModule],
  providers: [CertificationService],
})
export class CertificationModule {}
