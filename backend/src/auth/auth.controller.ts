import { Controller, Post, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { CurrentUser } from './current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: any) {
    const result = await this.authService.signup(body.email, body.password, body.name);
    return { data: result };
  }

  @Post('login')
  async login(@Body() body: any) {
    const result = await this.authService.login(body.email, body.password);
    return { data: result };
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    const tokens = await this.authService.refreshToken(body.refreshToken);
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
    const result = await this.authService.updateUser(user.userId, body.name);
    return { data: result };
  }

  @Put('password')
  @UseGuards(AuthGuard)
  async updatePassword(@CurrentUser() user: any, @Body() body: any) {
    const result = await this.authService.updatePassword(user.userId, body.currentPassword, body.newPassword);
    return { data: result };
  }
}
