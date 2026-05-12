import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { parseJsonArray } from '../utils/route-helpers.js';

export type UpdateProfileInput = {
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
};

const profileInclude = {
  user: true,
  educations: { orderBy: { startDate: 'desc' as const } },
  careers: { orderBy: { startDate: 'desc' as const } },
  certifications: { orderBy: { issueDate: 'desc' as const } },
  projects: { orderBy: { startDate: 'desc' as const } },
  skills: { orderBy: { createdAt: 'desc' as const } },
  swotAnalysis: true,
};

// Assuming ProfileWithRelations matches what prisma.profile.upsert returns with profileInclude
export type ProfileWithRelations = any;

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private async getRawProfile(userId: string) {
    return this.prisma.profile.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: profileInclude,
    });
  }

  private hasBasicInfo(profile: ProfileWithRelations) {
    return Boolean(profile.phone || profile.address || profile.bio || profile.profileImageUrl);
  }

  private calculateCompleteness(profile: ProfileWithRelations) {
    let total = 0;

    if (this.hasBasicInfo(profile)) total += 20;
    if (profile.educations?.length > 0) total += 15;
    if (profile.careers?.length > 0) total += 20;
    if (profile.certifications?.length > 0) total += 10;
    if (profile.projects?.length > 0) total += 20;
    if (profile.skills?.length > 0) total += 10;

    const swot = profile.swotAnalysis;
    const hasSwot = Boolean(
      swot &&
        (parseJsonArray(swot.strengths).length > 0 ||
          parseJsonArray(swot.weaknesses).length > 0 ||
          parseJsonArray(swot.opportunities).length > 0 ||
          parseJsonArray(swot.threats).length > 0),
    );

    if (hasSwot) total += 5;

    return total;
  }

  private formatProfile(profile: ProfileWithRelations) {
    return {
      ...profile,
      projects: profile.projects?.map((project: any) => ({
        ...project,
        techStack: parseJsonArray(project.techStack),
      })),
      swotAnalysis: profile.swotAnalysis
        ? {
            ...profile.swotAnalysis,
            strengths: parseJsonArray(profile.swotAnalysis.strengths),
            weaknesses: parseJsonArray(profile.swotAnalysis.weaknesses),
            opportunities: parseJsonArray(profile.swotAnalysis.opportunities),
            threats: parseJsonArray(profile.swotAnalysis.threats),
          }
        : null,
    };
  }

  async refreshProfileCompleteness(userId: string) {
    const profile = await this.getRawProfile(userId);
    const completeness = this.calculateCompleteness(profile);

    if (profile.completeness !== completeness) {
      await this.prisma.profile.update({
        where: { id: profile.id },
        data: { completeness },
      });
    }

    return completeness;
  }

  async getProfile(userId: string) {
    const profile = await this.getRawProfile(userId);
    const completeness = this.calculateCompleteness(profile);

    if (profile.completeness !== completeness) {
      const updated = await this.prisma.profile.update({
        where: { id: profile.id },
        data: { completeness },
        include: profileInclude,
      });
      return this.formatProfile(updated);
    }

    return this.formatProfile(profile);
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
      include: profileInclude,
    });

    const completeness = this.calculateCompleteness(profile);
    const updated = await this.prisma.profile.update({
      where: { id: profile.id },
      data: { completeness },
      include: profileInclude,
    });

    return this.formatProfile(updated);
  }

  async getProfileIdByUserId(userId: string) {
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return profile.id;
  }
}
