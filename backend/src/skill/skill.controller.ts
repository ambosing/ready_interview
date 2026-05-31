import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SkillService } from './skill.service.js';
import { parseBody, skillCreateSchema, skillUpdateSchema } from '../utils/validation.js';

@Controller('skills')
@UseGuards(AuthGuard)
export class SkillController {
  constructor(
    private readonly service: SkillService,
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService
  ) {}

  @Get('')
  async method1(@CurrentUser() user: any) {
    const profileId = await this.profileService.getProfileIdByUserId(user.userId);
    const results = await this.prisma.skill.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: results, total: results.length };
  }

  @Post('')
  async method2(@Body() body: any, @CurrentUser() user: any) {
    const profileId = await this.profileService.getProfileIdByUserId(user.userId);
    const payload = parseBody(skillCreateSchema, body);
    const result = await this.prisma.skill.create({
      data: {
        profileId,
        name: payload.name,
        category: payload.category ?? null,
        proficiency: payload.proficiency,
      },
    });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: result };
  }

  @Put(':id')
  async method3(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(skillUpdateSchema, body);
    const existing = await this.prisma.skill.findFirst({
      where: {
        id,
        profile: { userId: user.userId },
      },
    });

    if (!existing) {
      const error = new Error('Skill not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    const result = await this.prisma.skill.update({
      where: { id },
      data: {
        ...payload,
        ...(payload.category !== undefined ? { category: payload.category } : {}),
      },
    });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: result };
  }

  @Delete(':id')
  async method4(@Param('id') id: string, @CurrentUser() user: any) {
    const existing = await this.prisma.skill.findFirst({
      where: {
        id,
        profile: { userId: user.userId },
      },
    });

    if (!existing) {
      const error = new Error('Skill not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    await this.prisma.skill.delete({ where: { id } });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: { id } };
  }

}
