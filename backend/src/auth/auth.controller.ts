import { Controller, Post, Get, Put, Body, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { CurrentUser } from './current-user.decorator.js';
import {
  loginSchema,
  parseBody,
  signupSchema,
  updatePasswordSchema,
  updateUserSchema,
} from '../utils/validation.js';
import { config } from '../config/index.js';

export const REFRESH_TOKEN_COOKIE_NAME = 'hirey_refresh_token';
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getRefreshTokenCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: config.authCookieSecure,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    };
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string) {
    response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, this.getRefreshTokenCookieOptions());
  }

  private clearRefreshTokenCookie(response: Response) {
    const { maxAge: _maxAge, ...options } = this.getRefreshTokenCookieOptions();
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, options);
  }

  @Post('signup')
  async signup(@Body() body: any, @Res({ passthrough: true }) response: Response) {
    const payload = parseBody(signupSchema, body);
    const { refreshToken, ...result } = await this.authService.signup(payload.email, payload.password, payload.name);
    this.setRefreshTokenCookie(response, refreshToken);
    return { data: result };
  }

  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) response: Response) {
    const payload = parseBody(loginSchema, body);
    const { refreshToken, ...result } = await this.authService.login(payload.email, payload.password);
    this.setRefreshTokenCookie(response, refreshToken);
    return { data: result };
  }

  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
      throw new UnauthorizedException('Refresh token required');
    }

    const tokens = await this.authService.refreshToken(refreshToken);
    this.setRefreshTokenCookie(response, tokens.refreshToken);

    return { data: { accessToken: tokens.accessToken } };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    this.clearRefreshTokenCookie(response);
    return { data: { success: true } };
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
