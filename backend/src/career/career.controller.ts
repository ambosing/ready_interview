import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CareerService } from './career.service.js';

@Controller('careers')
@UseGuards(AuthGuard)
export class CareerController {
  constructor(
    private readonly service: CareerService,
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService
  ) {}

  @Get('')
  async method1(@CurrentUser() user: any) {
    const profileId = await this.profileService.getProfileIdByUserId(user.userId);
    const results = await this.prisma.career.findMany({
      where: { profileId },
      orderBy: { startDate: 'desc' },
    });
    return { data: results, total: results.length };
  }

  @Post('')
  async method2(@Body() body: any, @CurrentUser() user: any) {
    const profileId = await this.profileService.getProfileIdByUserId(user.userId);
    const payload = body; // Needs validation
    const result = await this.prisma.career.create({
      data: {
        profileId,
        company: payload.company,
        position: payload.position,
        department: payload.department ?? null,
        startDate: payload.startDate,
        endDate: payload.isCurrent ? null : (payload.endDate ?? null),
        isCurrent: payload.isCurrent ?? false,
        description: payload.description ?? null,
      },
    });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: result };
  }

  @Put(':id')
  async method3(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const payload = body; // Needs validation
    const existing = await this.prisma.career.findFirst({
      where: {
        id,
        profile: { userId: user.userId },
      },
    });

    if (!existing) {
      const error = new Error('Career not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    const isCurrent = payload.isCurrent ?? existing.isCurrent;
    const result = await this.prisma.career.update({
      where: { id },
      data: {
        ...payload,
        ...(payload.department !== undefined ? { department: payload.department } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.endDate !== undefined || payload.isCurrent !== undefined
          ? { endDate: isCurrent ? null : (payload.endDate ?? existing.endDate) }
          : {}),
      },
    });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: result };
  }

  @Delete(':id')
  async method4(@Param('id') id: string, @CurrentUser() user: any) {
    const existing = await this.prisma.career.findFirst({
      where: {
        id,
        profile: { userId: user.userId },
      },
    });

    if (!existing) {
      const error = new Error('Career not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    await this.prisma.career.delete({ where: { id } });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: { id } };
  }

}
