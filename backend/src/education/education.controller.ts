import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { EducationService } from './education.service.js';
import { educationCreateSchema, educationUpdateSchema, parseBody } from '../utils/validation.js';

@Controller('educations')
@UseGuards(AuthGuard)
export class EducationController {
  constructor(
    private readonly service: EducationService,
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService
  ) {}

  @Get('')
  async method1(@CurrentUser() user: any) {
    const profileId = await this.profileService.getProfileIdByUserId(user.userId);
    const results = await this.prisma.education.findMany({
      where: { profileId },
      orderBy: { startDate: 'desc' },
    });
    return { data: results, total: results.length };
  }

  @Post('')
  async method2(@Body() body: any, @CurrentUser() user: any) {
    const profileId = await this.profileService.getProfileIdByUserId(user.userId);
    const payload = parseBody(educationCreateSchema, body);
    const result = await this.prisma.education.create({
      data: {
        profileId,
        ...payload,
        description: payload.description ?? null,
        endDate: payload.endDate ?? null,
      },
    });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: result };
  }

  @Put(':id')
  async method3(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(educationUpdateSchema, body);
    const existing = await this.prisma.education.findFirst({
      where: {
        id,
        profile: { userId: user.userId },
      },
    });

    if (!existing) {
      const error = new Error('Education not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    const result = await this.prisma.education.update({
      where: { id },
      data: {
        ...payload,
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.endDate !== undefined ? { endDate: payload.endDate } : {}),
      },
    });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: result };
  }

  @Delete(':id')
  async method4(@Param('id') id: string, @CurrentUser() user: any) {
    const existing = await this.prisma.education.findFirst({
      where: {
        id,
        profile: { userId: user.userId },
      },
    });

    if (!existing) {
      const error = new Error('Education not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    await this.prisma.education.delete({ where: { id } });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: { id } };
  }

}
