import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ProfileService } from './profile.service.js';
import { parseBody, updateProfileSchema } from '../utils/validation.js';

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

}
