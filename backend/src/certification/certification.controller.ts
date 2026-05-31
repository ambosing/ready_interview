import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CertificationService } from './certification.service.js';
import { certificationCreateSchema, certificationUpdateSchema, parseBody } from '../utils/validation.js';

@Controller('certifications')
@UseGuards(AuthGuard)
export class CertificationController {
  constructor(
    private readonly service: CertificationService,
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService
  ) {}

  @Get('')
  async method1(@CurrentUser() user: any) {
    const profileId = await this.profileService.getProfileIdByUserId(user.userId);
    const results = await this.prisma.certification.findMany({
      where: { profileId },
      orderBy: { issueDate: 'desc' },
    });
    return { data: results, total: results.length };
  }

  @Post('')
  async method2(@Body() body: any, @CurrentUser() user: any) {
    const profileId = await this.profileService.getProfileIdByUserId(user.userId);
    const payload = parseBody(certificationCreateSchema, body);
    const result = await this.prisma.certification.create({
      data: {
        profileId,
        name: payload.name,
        issuer: payload.issuer,
        issueDate: payload.issueDate,
        expiryDate: payload.expiryDate ?? null,
        credentialId: payload.credentialId ?? null,
      },
    });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: result };
  }

  @Put(':id')
  async method3(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const payload = parseBody(certificationUpdateSchema, body);
    const existing = await this.prisma.certification.findFirst({
      where: {
        id,
        profile: { userId: user.userId },
      },
    });

    if (!existing) {
      const error = new Error('Certification not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    const result = await this.prisma.certification.update({
      where: { id },
      data: {
        ...payload,
        ...(payload.expiryDate !== undefined ? { expiryDate: payload.expiryDate } : {}),
        ...(payload.credentialId !== undefined ? { credentialId: payload.credentialId } : {}),
      },
    });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: result };
  }

  @Delete(':id')
  async method4(@Param('id') id: string, @CurrentUser() user: any) {
    const existing = await this.prisma.certification.findFirst({
      where: {
        id,
        profile: { userId: user.userId },
      },
    });

    if (!existing) {
      const error = new Error('Certification not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    await this.prisma.certification.delete({ where: { id } });
    await this.profileService.refreshProfileCompleteness(user.userId);
    return { data: { id } };
  }

}
