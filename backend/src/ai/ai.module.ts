import { Global, Module } from '@nestjs/common';
import { AiProviderController } from './ai-provider.controller.js';
import { AiProviderCredentialsService } from './ai-provider-credentials.service.js';
import { AiService } from './ai.service.js';

@Global()
@Module({
  controllers: [AiProviderController],
  providers: [AiService, AiProviderCredentialsService],
  exports: [AiService, AiProviderCredentialsService],
})
export class AiModule {}
