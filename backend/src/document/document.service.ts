import { DocumentType } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { AiService, type AiProviderConnection } from '../ai/ai.service.js';
import { resolveAiModel, type AiGenerationModel } from '../ai/ai-models.js';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly profileService: ProfileService
  ) {}

  private createNotFoundError() {
    return new NotFoundException('Document not found');
  }

  private resolveAiModel(aiModel?: string): AiGenerationModel {
    return resolveAiModel(aiModel);
  }

  async listDocuments(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [results, total] = await this.prisma.$transaction([
      this.prisma.generatedDocument.findMany({
        where: { userId },
        include: { jobPosting: true, versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.generatedDocument.count({ where: { userId } }),
    ]);

    return { results, total };
  }

  async getDocument(userId: string, id: string) {
    const document = await this.prisma.generatedDocument.findFirst({
      where: { id, userId },
      include: {
        jobPosting: true,
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });

    if (!document) {
      throw this.createNotFoundError();
    }

    return document;
  }

  async generateDocument(
    userId: string,
    type: DocumentType,
    jobPostingId: string,
    aiModel?: string,
    aiProviderConnection?: AiProviderConnection,
  ) {
    const [profile, jobPosting] = await Promise.all([
      this.profileService.getProfile(userId),
      this.prisma.jobPosting.findFirst({ where: { id: jobPostingId, userId } }),
    ]);

    if (!jobPosting) {
      throw new NotFoundException('Job posting not found');
    }

    const selectedAiModel = this.resolveAiModel(aiModel);
    const content = type === DocumentType.RESUME
      ? await this.aiService.generateResume(profile as any, jobPosting as any, selectedAiModel, aiProviderConnection)
      : await this.aiService.generatePortfolio(profile as any, jobPosting as any, selectedAiModel, aiProviderConnection);
    const title = `${jobPosting.company ?? '지원 기업'} ${type === DocumentType.RESUME ? '이력서' : '포트폴리오'}`;

    const document = await this.prisma.generatedDocument.create({
      data: {
        jobPostingId,
        userId,
        type,
        title,
        content,
        versions: {
          create: {
            content,
            versionNumber: 1,
          },
        },
      },
      include: {
        jobPosting: true,
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });

    return document;
  }

  async updateDocument(userId: string, id: string, content: string) {
    const existing = await this.prisma.generatedDocument.findFirst({
      where: { id, userId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!existing) {
      throw this.createNotFoundError();
    }

    const latestVersion = existing.versions[0]?.versionNumber ?? 0;

    const [, document] = await this.prisma.$transaction([
      this.prisma.documentVersion.create({
        data: {
          documentId: id,
          content,
          versionNumber: latestVersion + 1,
        },
      }),
      this.prisma.generatedDocument.update({
        where: { id },
        data: { content },
        include: {
          jobPosting: true,
          versions: { orderBy: { versionNumber: 'desc' } },
        },
      }),
    ]);

    return document;
  }

  async deleteDocument(userId: string, id: string) {
    const existing = await this.prisma.generatedDocument.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw this.createNotFoundError();
    }

    await this.prisma.generatedDocument.delete({ where: { id } });
  }
}
