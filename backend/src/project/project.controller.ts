import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ProjectService } from './project.service.js';
import { parseJsonArray } from '../utils/route-helpers.js';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectController {
  constructor(
    private readonly service: ProjectService,
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService
  ) {}

  private formatProject<T extends { techStack: string }>(project: T) {
    return {
      ...project,
      techStack: parseJsonArray(project.techStack),
    };
  }

  @Get('')
  async method1(@CurrentUser() user: any) {
    const profileId = await this.profileService.getProfileIdByUserId(user.userId);
    const results = await this.prisma.project.findMany({
      where: { profileId },
      orderBy: { startDate: 'desc' },
    });
    return { data: results.map(this.formatProject), total: results.length };
  }

  @Post('')
  async method2(@Body() body: any, @CurrentUser() user: any) {
    const profileId = await this.profileService.getProfileIdByUserId(user.userId);
    const payload = body; // Needs validation
    const result = await this.prisma.project.create({
      data: {
        profileId,
        name: payload.name,
        description: payload.description,
        role: payload.role,
        techStack: JSON.stringify(payload.techStack),
        startDate: payload.startDate,
        endDate: payload.endDate ?? null,
        achievements: payload.achievements ?? null,
        url: payload.url ?? null,
      },
    });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: this.formatProject(result) };
  }

  @Put(':id')
  async method3(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const payload = body; // Needs validation
    const existing = await this.prisma.project.findFirst({
      where: {
        id,
        profile: { userId: user.userId },
      },
    });

    if (!existing) {
      const error = new Error('Project not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    const result = await this.prisma.project.update({
      where: { id },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.role !== undefined ? { role: payload.role } : {}),
        ...(payload.startDate !== undefined ? { startDate: payload.startDate } : {}),
        ...(payload.techStack !== undefined ? { techStack: JSON.stringify(payload.techStack) } : {}),
        ...(payload.achievements !== undefined ? { achievements: payload.achievements } : {}),
        ...(payload.url !== undefined ? { url: payload.url } : {}),
        ...(payload.endDate !== undefined ? { endDate: payload.endDate } : {}),
      },
    });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: this.formatProject(result) };
  }

  @Delete(':id')
  async method4(@Param('id') id: string, @CurrentUser() user: any) {
    const existing = await this.prisma.project.findFirst({
      where: {
        id,
        profile: { userId: user.userId },
      },
    });

    if (!existing) {
      const error = new Error('Project not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    await this.prisma.project.delete({ where: { id } });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: { id } };
  }

}
