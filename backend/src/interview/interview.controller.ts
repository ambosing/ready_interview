import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { InterviewService } from './interview.service.js';
import {
  aiModelBodySchema,
  interviewCreateSchema,
  interviewMessageSchema,
  parseBody,
} from '../utils/validation.js';

@Controller('interviews')
@UseGuards(AuthGuard)
export class InterviewController {
  constructor(private readonly service: InterviewService) {}

  @Get('')
  async method1(@CurrentUser() user: any) {
    const results = await this.service.listInterviewSessions(user.userId);
    return { data: results, total: results.length };
  }

  @Get(':id')
  async method2(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.service.getInterviewSession(user.userId, id);
    return { data: result };
  }

  @Post('applications/:applicationId/questions')
  async methodQuestions(@Param('applicationId') applicationId: string, @Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(aiModelBodySchema, body);
    const result = await this.service.getExpectedQuestions(
      user.userId,
      applicationId,
      payload.aiModel,
    );
    return { data: result };
  }

  @Post('')
  async method3(@Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(interviewCreateSchema, body);
    const result = await this.service.createInterviewSession(user.userId, payload);
    return { data: result };
  }

  @Post(':id/messages')
  async method4(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(interviewMessageSchema, body);
    const result = await this.service.sendInterviewMessage(
      user.userId,
      id,
      payload.content,
      payload.aiModel,
    );
    return { data: result };
  }

  @Post(':id/end')
  async method5(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(aiModelBodySchema, body);
    const result = await this.service.endInterviewSession(user.userId, id, payload.aiModel);
    return { data: result };
  }

  @Delete(':id')
  async method6(@Param('id') id: string, @CurrentUser() user: any) {
    await this.service.deleteInterviewSession(user.userId, id);
    return { data: { id } };
  }

}
