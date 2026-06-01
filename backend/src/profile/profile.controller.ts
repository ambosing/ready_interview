import { Body, Controller, Get, Post, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ProfileService } from './profile.service.js';
import { parseBody, profileResumeImportSchema, updateProfileSchema } from '../utils/validation.js';

@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get('')
  async method1(@CurrentUser() user: any) {
    const result = await this.service.getProfile(user.userId);
    return { data: result };
  }

  @Put('')
  async method2(@Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(updateProfileSchema, body);
    const result = await this.service.updateProfile(user.userId, payload);
    return { data: result };
  }

  @Post('import-resume')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async method3(@UploadedFile() file: any, @Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(profileResumeImportSchema, body);
    const result = await this.service.importResumeFile(
      user.userId,
      file,
      payload.aiModel,
    );
    return { data: result };
  }

}
