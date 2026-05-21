import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { DocumentService } from './document.service.js';

@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  @Get('')
  async method1(@Query() query: any, @CurrentUser() user: any) {
    const { page, limit } = query; // Needs validation
    const { results, total } = await this.service.listDocuments(user.userId, page, limit);
    return { data: results, total };
  }

  @Get(':id')
  async method2(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.service.getDocument(user.userId, id);
    return { data: result };
  }

  @Post('generate')
  async method3(@Body() body: any, @CurrentUser() user: any) {
    const payload = body; // Needs validation
    const result = await this.service.generateDocument(user.userId, payload.type, payload.jobPostingId, payload.aiModel);
    return { data: result };
  }

  @Put(':id')
  async method4(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const { content } = body; // Needs validation
    const result = await this.service.updateDocument(user.userId, id, content);
    return { data: result };
  }

  @Delete(':id')
  async method5(@Param('id') id: string, @CurrentUser() user: any) {
    await this.service.deleteDocument(user.userId, id);
    return { data: { id } };
  }

}
