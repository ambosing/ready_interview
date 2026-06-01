import { JobPostingStatus } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { resolveAiModel } from '../ai/ai-models.js';
import { parseJsonArray, serializeStringArray } from '../utils/route-helpers.js';

export type JobPostingInput = {
  title: string;
  company?: string | null;
  url?: string | null;
  content: string;
};

@Injectable()
export class JobPostingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  private createNotFoundError() {
    return new NotFoundException('Job posting not found');
  }

  private formatJobPosting<T extends { analyzedKeywords: string | null; analyzedRequirements: string | null }>(jobPosting: T) {
    return {
      ...jobPosting,
      analyzedKeywords: parseJsonArray(jobPosting.analyzedKeywords),
      analyzedRequirements: parseJsonArray(jobPosting.analyzedRequirements),
    };
  }

  async listJobPostings(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [results, total] = await this.prisma.$transaction([
      this.prisma.jobPosting.findMany({
        where: { userId },
        include: { documents: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.jobPosting.count({ where: { userId } }),
    ]);

    return {
      results: results.map(r => this.formatJobPosting(r)),
      total,
    };
  }

  async getJobPosting(userId: string, id: string) {
    const jobPosting = await this.prisma.jobPosting.findFirst({
      where: { id, userId },
      include: { documents: { orderBy: { createdAt: 'desc' } } },
    });

    if (!jobPosting) throw this.createNotFoundError();
    return this.formatJobPosting(jobPosting);
  }

  async createJobPosting(userId: string, data: JobPostingInput) {
    const jobPosting = await this.prisma.jobPosting.create({
      data: {
        userId,
        title: data.title,
        company: data.company ?? null,
        url: data.url ?? null,
        content: data.content,
      },
    });
    return this.formatJobPosting(jobPosting);
  }

  async updateJobPosting(userId: string, id: string, data: Partial<JobPostingInput>) {
    const existing = await this.prisma.jobPosting.findFirst({ where: { id, userId } });
    if (!existing) throw this.createNotFoundError();

    const jobPosting = await this.prisma.jobPosting.update({
      where: { id },
      data,
    });
    return this.formatJobPosting(jobPosting);
  }

  async deleteJobPosting(userId: string, id: string) {
    const existing = await this.prisma.jobPosting.findFirst({ where: { id, userId } });
    if (!existing) throw this.createNotFoundError();
    await this.prisma.jobPosting.delete({ where: { id } });
  }

  async analyzeJobPostingById(userId: string, id: string, aiModel?: string) {
    const existing = await this.prisma.jobPosting.findFirst({ where: { id, userId } });
    if (!existing) throw this.createNotFoundError();

    const analysis = await this.aiService.analyzeJobPosting(existing.content, resolveAiModel(aiModel), userId);
    const jobPosting = await this.prisma.jobPosting.update({
      where: { id },
      data: {
        status: JobPostingStatus.ANALYZED,
        analyzedKeywords: serializeStringArray(analysis.keywords),
        analyzedRequirements: serializeStringArray(analysis.requirements),
      },
      include: { documents: { orderBy: { createdAt: 'desc' } } },
    });

    return {
      ...this.formatJobPosting(jobPosting),
      companyInfo: analysis.companyInfo,
    };
  }
}
