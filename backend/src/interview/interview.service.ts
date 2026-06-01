import { InterviewDifficulty, InterviewStatus, InterviewType, MessageRole } from '@prisma/client';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { resolveAiModel } from '../ai/ai-models.js';

@Injectable()
export class InterviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  private createNotFoundError() {
    return new NotFoundException('Interview session not found');
  }

  private parseFeedback(value: string | null) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private formatSession<T extends { feedback: string | null }>(session: T) {
    return {
      ...session,
      feedback: this.parseFeedback(session.feedback),
    };
  }

  async listInterviewSessions(userId: string) {
    const results = await this.prisma.interviewSession.findMany({
      where: { userId },
      include: {
        application: {
          include: { jobPosting: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
    return results.map(s => this.formatSession(s));
  }

  async getInterviewSession(userId: string, id: string) {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id, userId },
      include: {
        application: { include: { jobPosting: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session) throw this.createNotFoundError();
    return this.formatSession(session);
  }

  async createInterviewSession(
    userId: string,
    data: { applicationId: string; type: InterviewType; difficulty: InterviewDifficulty },
  ) {
    const application = await this.prisma.application.findFirst({
      where: { id: data.applicationId, userId },
    });

    if (!application) throw new NotFoundException('Application not found');

    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        applicationId: data.applicationId,
        type: data.type,
        difficulty: data.difficulty,
      },
      include: {
        application: { include: { jobPosting: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.formatSession(session);
  }

  async getExpectedQuestions(
    userId: string,
    applicationId: string,
    aiModel?: string,
  ) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: { jobPosting: true },
    });

    if (!application) throw new NotFoundException('Application not found');

    return this.aiService.generateExpectedQuestions(
      application.jobPosting as any,
      resolveAiModel(aiModel),
      userId,
    );
  }

  async sendInterviewMessage(
    userId: string,
    id: string,
    content: string,
    aiModel?: string,
  ) {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session) throw this.createNotFoundError();
    if (session.status === InterviewStatus.COMPLETED) {
      throw new BadRequestException('Interview session already completed');
    }

    const allMessages = await this.prisma.$transaction(async (tx) => {
      await tx.interviewMessage.create({
        data: { sessionId: id, role: MessageRole.USER, content },
      });

      const currentMessages = await tx.interviewMessage.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: 'asc' },
      });

      const response = await this.aiService.generateInterviewerResponse(
        currentMessages as any,
        session.difficulty as any,
        resolveAiModel(aiModel),
        userId,
      );

      await tx.interviewMessage.create({
        data: { sessionId: id, role: MessageRole.INTERVIEWER, content: response },
      });

      return tx.interviewMessage.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: 'asc' },
      });
    });

    return {
      messages: allMessages,
      response: allMessages[allMessages.length - 1],
    };
  }

  async endInterviewSession(userId: string, id: string, aiModel?: string) {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id, userId },
      include: {
        application: { include: { jobPosting: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session) throw this.createNotFoundError();

    const feedback = await this.aiService.generateInterviewFeedback(
      session.messages as any,
      resolveAiModel(aiModel),
      userId,
    );
    const updated = await this.prisma.interviewSession.update({
      where: { id },
      data: {
        status: InterviewStatus.COMPLETED,
        endedAt: new Date(),
        feedback: JSON.stringify(feedback),
      },
      include: {
        application: { include: { jobPosting: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    return this.formatSession(updated);
  }

  async deleteInterviewSession(userId: string, id: string) {
    const existing = await this.prisma.interviewSession.findFirst({ where: { id, userId } });
    if (!existing) throw this.createNotFoundError();
    await this.prisma.interviewSession.delete({ where: { id } });
  }
}
