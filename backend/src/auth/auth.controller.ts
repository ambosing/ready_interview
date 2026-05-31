import { Controller, Post, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { CurrentUser } from './current-user.decorator.js';
import {
  loginSchema,
  parseBody,
  refreshTokenSchema,
  signupSchema,
  updatePasswordSchema,
  updateUserSchema,
} from '../utils/validation.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: any) {
    const payload = parseBody(signupSchema, body);
    const result = await this.authService.signup(payload.email, payload.password, payload.name);
    return { data: result };
  }

  @Post('login')
  async login(@Body() body: any) {
    const payload = parseBody(loginSchema, body);
    const result = await this.authService.login(payload.email, payload.password);
    return { data: result };
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    const payload = parseBody(refreshTokenSchema, body);
    const tokens = await this.authService.refreshToken(payload.refreshToken);
    return { data: tokens };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: any) {
    const result = await this.authService.getCurrentUser(user.userId);
    return { data: result };
  }
  @Put('me')
  @UseGuards(AuthGuard)
  async updateMe(@CurrentUser() user: any, @Body() body: any) {
    const payload = parseBody(updateUserSchema, body);
    const result = await this.authService.updateUser(user.userId, payload.name);
    return { data: result };
  }

  @Put('password')
  @UseGuards(AuthGuard)
  async updatePassword(@CurrentUser() user: any, @Body() body: any) {
    const payload = parseBody(updatePasswordSchema, body);
    const result = await this.authService.updatePassword(user.userId, payload.currentPassword, payload.newPassword);
    return { data: result };
  }
}
