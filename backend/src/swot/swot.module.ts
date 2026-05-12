import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { SwotController } from './swot.controller.js';
import { SwotService } from './swot.service.js';

@Module({
  controllers: [SwotController],
  imports: [ProfileModule],
  providers: [SwotService],
})
export class SwotModule {}
