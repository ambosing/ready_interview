import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { aiProviderCredentialSaveSchema, parseBody } from '../utils/validation.js';
import { AiProviderCredentialsService } from './ai-provider-credentials.service.js';

@Controller('ai/providers')
@UseGuards(AuthGuard)
export class AiProviderController {
  constructor(private readonly credentialsService: AiProviderCredentialsService) {}

  @Get('')
  async method1(@CurrentUser() user: any) {
    const result = await this.credentialsService.listStatuses(user.userId);
    return { data: result };
  }

  @Put(':provider')
  async method2(@Param('provider') provider: string, @Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(aiProviderCredentialSaveSchema, body);
    await this.credentialsService.save(user.userId, provider, payload);
    const result = await this.credentialsService.listStatuses(user.userId);
    return { data: result };
  }

  @Delete(':provider')
  async method3(@Param('provider') provider: string, @CurrentUser() user: any) {
    await this.credentialsService.remove(user.userId, provider);
    const result = await this.credentialsService.listStatuses(user.userId);
    return { data: result };
  }
}
