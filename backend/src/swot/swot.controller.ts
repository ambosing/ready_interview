import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SwotService } from './swot.service.js';
import { parseJsonArray } from '../utils/route-helpers.js';

@Controller('swot')
@UseGuards(AuthGuard)
export class SwotController {
  constructor(
    private readonly service: SwotService,
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService
  ) {}

  private formatSwot<T extends { strengths: string; weaknesses: string; opportunities: string; threats: string }>(swot: T) {
    return {
      ...swot,
      strengths: parseJsonArray(swot.strengths),
      weaknesses: parseJsonArray(swot.weaknesses),
      opportunities: parseJsonArray(swot.opportunities),
      threats: parseJsonArray(swot.threats),
    };
  }

  @Get('')
  async method1(@CurrentUser() user: any) {
    const profileId = await this.profileService.getProfileIdByUserId(user.userId);
    const result = await this.prisma.swotAnalysis.findUnique({
      where: { profileId },
    });
    return {
      data: result
        ? this.formatSwot(result)
        : {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: [],
          },
    };
  }

  @Put('')
  async method2(@Body() body: any, @CurrentUser() user: any) {
    const profileId = await this.profileService.getProfileIdByUserId(user.userId);
    const payload = body; // Needs validation
    const result = await this.prisma.swotAnalysis.upsert({
      where: { profileId },
      update: {
        strengths: JSON.stringify(payload.strengths),
        weaknesses: JSON.stringify(payload.weaknesses),
        opportunities: JSON.stringify(payload.opportunities),
        threats: JSON.stringify(payload.threats),
      },
      create: {
        profileId,
        strengths: JSON.stringify(payload.strengths),
        weaknesses: JSON.stringify(payload.weaknesses),
        opportunities: JSON.stringify(payload.opportunities),
        threats: JSON.stringify(payload.threats),
      },
    });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: this.formatSwot(result) };
  }

}
