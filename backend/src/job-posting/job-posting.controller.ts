import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JobPostingService } from './job-posting.service.js';
import { parsePaginationQuery } from '../utils/route-helpers.js';
import {
  aiModelBodySchema,
  jobPostingCreateSchema,
  jobPostingUpdateSchema,
  parseBody,
} from '../utils/validation.js';

@Controller('job-postings')
@UseGuards(AuthGuard)
export class JobPostingController {
  constructor(private readonly service: JobPostingService) {}

  @Get('')
  async method1(@Query() query: any, @CurrentUser() user: any) {
    const { page, limit } = parsePaginationQuery(query);
    const { results, total } = await this.service.listJobPostings(user.userId, page, limit);
    return { data: results, total };
  }

  @Get(':id')
  async method2(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.service.getJobPosting(user.userId, id);
    return { data: result };
  }

  @Post('')
  async method3(@Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(jobPostingCreateSchema, body);
    const result = await this.service.createJobPosting(user.userId, payload);
    return { data: result };
  }

  @Put(':id')
  async method4(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(jobPostingUpdateSchema, body);
    const result = await this.service.updateJobPosting(user.userId, id, payload);
    return { data: result };
  }

  @Delete(':id')
  async method5(@Param('id') id: string, @CurrentUser() user: any) {
    await this.service.deleteJobPosting(user.userId, id);
    return { data: { id } };
  }

  @Post(':id/analyze')
  async method6(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(aiModelBodySchema, body);
    const result = await this.service.analyzeJobPostingById(user.userId, id, payload.aiModel);
    return { data: result };
  }

}
