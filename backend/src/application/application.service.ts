import { ApplicationStatus, JobPostingStatus } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type ApplicationInput = {
  jobPostingId: string;
  status: ApplicationStatus;
  notes?: string | null;
};

@Injectable()
export class ApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  private createNotFoundError() {
    return new NotFoundException('Application not found');
  }

  async listApplications(userId: string, page: number, limit: number, status?: ApplicationStatus) {
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(status ? { status } : {}),
    };

    const [results, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        include: { jobPosting: true },
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.application.count({ where }),
    ]);

    return { results, total };
  }

  async getApplication(userId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, userId },
      include: {
        jobPosting: true,
        interviews: { orderBy: { startedAt: 'desc' } },
        evaluations: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!application) {
      throw this.createNotFoundError();
    }

    return application;
  }

  async createApplication(userId: string, data: ApplicationInput) {
    const jobPosting = await this.prisma.jobPosting.findFirst({
      where: { id: data.jobPostingId, userId },
    });

    if (!jobPosting) {
      throw new NotFoundException('Job posting not found');
    }

    const application = await this.prisma.application.create({
      data: {
        userId,
        jobPostingId: data.jobPostingId,
        status: data.status,
        notes: data.notes ?? null,
      },
      include: { jobPosting: true, interviews: true, evaluations: true },
    });

    await this.prisma.jobPosting.update({
      where: { id: data.jobPostingId },
      data: { status: JobPostingStatus.APPLIED },
    });

    return application;
  }

  async updateApplication(userId: string, id: string, data: { status?: ApplicationStatus; notes?: string | null }) {
    const existing = await this.prisma.application.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw this.createNotFoundError();
    }

    return this.prisma.application.update({
      where: { id },
      data,
      include: {
        jobPosting: true,
        interviews: { orderBy: { startedAt: 'desc' } },
        evaluations: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async deleteApplication(userId: string, id: string) {
    const existing = await this.prisma.application.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw this.createNotFoundError();
    }

    await this.prisma.application.delete({ where: { id } });
  }
}
