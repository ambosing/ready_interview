import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ApplicationService } from './application.service.js';
import { parsePaginationQuery } from '../utils/route-helpers.js';
import { applicationCreateSchema, applicationListQuerySchema, applicationUpdateSchema, parseBody } from '../utils/validation.js';

@Controller('applications')
@UseGuards(AuthGuard)
export class ApplicationController {
  constructor(private readonly service: ApplicationService) {}

  @Get('')
  async method1(@Query() query: any, @CurrentUser() user: any) {
    const { status } = parseBody(applicationListQuerySchema, query);
    const { page, limit } = parsePaginationQuery(query);
    const { results, total } = await this.service.listApplications(user.userId, page, limit, status);
    return { data: results, total };
  }

  @Get(':id')
  async method2(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.service.getApplication(user.userId, id);
    return { data: result };
  }

  @Post('')
  async method3(@Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(applicationCreateSchema, body);
    const result = await this.service.createApplication(user.userId, payload);
    return { data: result };
  }

  @Put(':id')
  async method4(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(applicationUpdateSchema, body);
    const result = await this.service.updateApplication(user.userId, id, payload);
    return { data: result };
  }

  @Delete(':id')
  async method5(@Param('id') id: string, @CurrentUser() user: any) {
    await this.service.deleteApplication(user.userId, id);
    return { data: { id } };
  }

}
