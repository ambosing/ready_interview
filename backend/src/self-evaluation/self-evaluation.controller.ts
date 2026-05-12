import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SelfEvaluationService } from './self-evaluation.service.js';

@Controller('self-evaluations')
@UseGuards(AuthGuard)
export class SelfEvaluationController {
  constructor(
    private readonly service: SelfEvaluationService,
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService
  ) {}

  @Get('')
  async method1(@CurrentUser() user: any) {
    const results = await this.prisma.selfEvaluation.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: results, total: results.length };
  }

  @Get(':id')
  async method2(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.prisma.selfEvaluation.findFirst({
      where: { id, userId: user.userId },
      include: { application: { include: { jobPosting: true } } },
    });

    if (!result) {
      const error = new Error('Self evaluation not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }
    return { data: result };
  }

  @Post('')
  async method3(@Body() body: any, @CurrentUser() user: any) {
    const payload = body; // Needs validation
    const application = await this.prisma.application.findFirst({
      where: { id: payload.applicationId, userId: user.userId },
    });

    if (!application) {
      const error = new Error('Application not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    const result = await this.prisma.selfEvaluation.create({
      data: {
        applicationId: payload.applicationId,
        userId: user.userId,
        performance: payload.performance,
        strengths: payload.strengths ?? null,
        improvements: payload.improvements ?? null,
        questionsAsked: payload.questionsAsked ?? null,
        notes: payload.notes ?? null,
      },
      include: { application: { include: { jobPosting: true } } },
    });
    return { data: result };
  }

  @Put(':id')
  async method4(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const payload = body; // Needs validation
    const existing = await this.prisma.selfEvaluation.findFirst({
      where: { id, userId: user.userId },
    });

    if (!existing) {
      const error = new Error('Self evaluation not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    const result = await this.prisma.selfEvaluation.update({
      where: { id },
      data: {
        ...payload,
        ...(payload.strengths !== undefined ? { strengths: payload.strengths } : {}),
        ...(payload.improvements !== undefined ? { improvements: payload.improvements } : {}),
        ...(payload.questionsAsked !== undefined ? { questionsAsked: payload.questionsAsked } : {}),
        ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      },
      include: { application: { include: { jobPosting: true } } },
    });
    return { data: result };
  }

  @Delete(':id')
  async method5(@Param('id') id: string, @CurrentUser() user: any) {
    const existing = await this.prisma.selfEvaluation.findFirst({
      where: { id, userId: user.userId },
    });

    if (!existing) {
      const error = new Error('Self evaluation not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    await this.prisma.selfEvaluation.delete({ where: { id } });
    return { data: { id } };
  }

}
