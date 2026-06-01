import { BadRequestException, Injectable } from '@nestjs/common';
import { Proficiency } from '@prisma/client';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { PrismaService } from '../prisma/prisma.service.js';
import { parseJsonArray } from '../utils/route-helpers.js';
import { AiService, type ImportedResumeProfile } from '../ai/ai.service.js';
import { resolveAiModel } from '../ai/ai-models.js';

export type UpdateProfileInput = {
  phone?: string | null;
  address?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
};

type ResumeUploadFile = {
  originalname?: string;
  mimetype?: string;
  buffer?: Buffer;
  size?: number;
};

type ResumeImportSummary = {
  source: {
    fileName: string;
    extractedCharacters: number;
  };
  basicInfoUpdated: string[];
  educationsCreated: number;
  careersCreated: number;
  certificationsCreated: number;
  projectsCreated: number;
  skillsCreated: number;
  swotUpdated: boolean;
  duplicatesSkipped: number;
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

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

  private textOrNull(value: unknown, maxLength = 1000) {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null;
  }

  private stringArray(value: unknown, maxItems = 20) {
    if (!Array.isArray(value)) return [];

    return value
      .map((item) => this.textOrNull(item, 100))
      .filter((item): item is string => Boolean(item))
      .slice(0, maxItems);
  }

  private normalizeUrl(value: unknown) {
    const text = this.textOrNull(value, 500);
    if (!text) return null;

    try {
      return new URL(text).toString();
    } catch {
      return null;
    }
  }

  private normalizeProficiency(value: unknown) {
    if (value === Proficiency.BEGINNER || value === Proficiency.ADVANCED || value === Proficiency.EXPERT) {
      return value;
    }

    return Proficiency.INTERMEDIATE;
  }

  private parseImportedDate(value: unknown) {
    const text = this.textOrNull(value, 32);
    if (!text || /현재|재직|진행|present|current/i.test(text)) return null;

    const normalized = text
      .replace(/[./]/g, '-')
      .replace(/년/g, '-')
      .replace(/월|일/g, '')
      .replace(/\s+/g, '')
      .replace(/-+/g, '-')
      .replace(/-$/g, '');
    const match = normalized.match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/);

    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2] ?? '1');
      const day = Number(match[3] ?? '1');

      if (year >= 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return new Date(Date.UTC(year, month - 1, day));
      }
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private dateKey(value: Date | null | undefined) {
    if (!value) return '';
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private importKey(parts: Array<string | Date | null | undefined>) {
    return parts
      .map((part) => {
        if (part instanceof Date) return this.dateKey(part);
        return String(part ?? '');
      })
      .join('|')
      .toLowerCase()
      .replace(/\s+/g, '');
  }

  private mergeStringArrays(left: string[], right: string[]) {
    const seen = new Set<string>();
    const merged: string[] = [];

    for (const item of [...left, ...right]) {
      const key = item.trim().toLowerCase();
      if (!key || seen.has(key)) continue;

      seen.add(key);
      merged.push(item.trim());
    }

    return merged;
  }

  private normalizeImportedProfile(imported: ImportedResumeProfile) {
    const educations = (imported.educations ?? [])
      .map((education) => {
        const school = this.textOrNull(education.school, 200);
        const startDate = this.parseImportedDate(education.startDate);
        if (!school || !startDate) return null;

        return {
          school,
          major: this.textOrNull(education.major, 200) ?? '미기재',
          degree: this.textOrNull(education.degree, 100) ?? '미기재',
          startDate,
          endDate: this.parseImportedDate(education.endDate),
          description: this.textOrNull(education.description, 2000),
        };
      })
      .filter((education): education is NonNullable<typeof education> => Boolean(education));

    const careers = (imported.careers ?? [])
      .map((career) => {
        const company = this.textOrNull(career.company, 200);
        const startDate = this.parseImportedDate(career.startDate);
        if (!company || !startDate) return null;

        const isCurrent = Boolean(career.isCurrent) || !career.endDate;

        return {
          company,
          position: this.textOrNull(career.position, 200) ?? '미기재',
          department: this.textOrNull(career.department, 200),
          startDate,
          endDate: isCurrent ? null : this.parseImportedDate(career.endDate),
          isCurrent,
          description: this.textOrNull(career.description, 3000),
        };
      })
      .filter((career): career is NonNullable<typeof career> => Boolean(career));

    const certifications = (imported.certifications ?? [])
      .map((certification) => {
        const name = this.textOrNull(certification.name, 200);
        const issueDate = this.parseImportedDate(certification.issueDate);
        if (!name || !issueDate) return null;

        return {
          name,
          issuer: this.textOrNull(certification.issuer, 200) ?? '미기재',
          issueDate,
          expiryDate: this.parseImportedDate(certification.expiryDate),
          credentialId: this.textOrNull(certification.credentialId, 200),
        };
      })
      .filter((certification): certification is NonNullable<typeof certification> => Boolean(certification));

    const projects = (imported.projects ?? [])
      .map((project) => {
        const name = this.textOrNull(project.name, 200);
        const description = this.textOrNull(project.description, 3000);
        const startDate = this.parseImportedDate(project.startDate);
        if (!name || !description || !startDate) return null;

        return {
          name,
          description,
          role: this.textOrNull(project.role, 200) ?? '미기재',
          techStack: this.stringArray(project.techStack),
          startDate,
          endDate: this.parseImportedDate(project.endDate),
          achievements: this.textOrNull(project.achievements, 3000),
          url: this.normalizeUrl(project.url),
        };
      })
      .filter((project): project is NonNullable<typeof project> => Boolean(project));

    const skills = (imported.skills ?? [])
      .map((skill) => {
        const name = this.textOrNull(skill.name, 100);
        if (!name) return null;

        return {
          name,
          category: this.textOrNull(skill.category, 100),
          proficiency: this.normalizeProficiency(skill.proficiency),
        };
      })
      .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill));

    return {
      basicInfo: {
        phone: this.textOrNull(imported.basicInfo?.phone, 100),
        address: this.textOrNull(imported.basicInfo?.address, 500),
        bio: this.textOrNull(imported.basicInfo?.bio, 3000),
      },
      educations,
      careers,
      certifications,
      projects,
      skills,
      swotAnalysis: imported.swotAnalysis
        ? {
            strengths: this.stringArray(imported.swotAnalysis.strengths, 10),
            weaknesses: this.stringArray(imported.swotAnalysis.weaknesses, 10),
            opportunities: this.stringArray(imported.swotAnalysis.opportunities, 10),
            threats: this.stringArray(imported.swotAnalysis.threats, 10),
          }
        : null,
    };
  }

  private supportedResumeExtension(fileName: string) {
    return fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';
  }

  private async extractTextFromResumeFile(file: ResumeUploadFile) {
    if (!file?.buffer || file.buffer.length === 0) {
      throw new BadRequestException('이력서 파일을 첨부해 주세요.');
    }

    const fileName = file.originalname ?? 'resume';
    const extension = this.supportedResumeExtension(fileName);
    const mimeType = file.mimetype ?? '';

    if (extension === 'pdf' || mimeType === 'application/pdf') {
      const parser = new PDFParse({ data: file.buffer });

      try {
        const result = await parser.getText();
        return result.text;
      } finally {
        await parser.destroy();
      }
    }

    if (
      extension === 'docx' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }

    if (['txt', 'md', 'markdown', 'json'].includes(extension) || mimeType.startsWith('text/') || mimeType === 'application/json') {
      return file.buffer.toString('utf8');
    }

    throw new BadRequestException('PDF, DOCX, TXT, MD 파일만 업로드할 수 있습니다.');
  }

  private async applyImportedProfile(
    userId: string,
    imported: ImportedResumeProfile,
    source: ResumeImportSummary['source'],
  ) {
    const profile = await this.getRawProfile(userId);
    const normalized = this.normalizeImportedProfile(imported);
    const summary: ResumeImportSummary = {
      source,
      basicInfoUpdated: [],
      educationsCreated: 0,
      careersCreated: 0,
      certificationsCreated: 0,
      projectsCreated: 0,
      skillsCreated: 0,
      swotUpdated: false,
      duplicatesSkipped: 0,
    };

    const profileUpdates: UpdateProfileInput = {};
    if (normalized.basicInfo.phone && !profile.phone) {
      profileUpdates.phone = normalized.basicInfo.phone;
      summary.basicInfoUpdated.push('phone');
    }
    if (normalized.basicInfo.address && !profile.address) {
      profileUpdates.address = normalized.basicInfo.address;
      summary.basicInfoUpdated.push('address');
    }
    if (normalized.basicInfo.bio && !profile.bio) {
      profileUpdates.bio = normalized.basicInfo.bio;
      summary.basicInfoUpdated.push('bio');
    }

    if (Object.keys(profileUpdates).length > 0) {
      await this.prisma.profile.update({
        where: { id: profile.id },
        data: profileUpdates,
      });
    }

    const educationKeys = new Set(
      profile.educations.map((education: any) => this.importKey([education.school, education.major, education.degree, education.startDate])),
    );
    for (const education of normalized.educations) {
      const key = this.importKey([education.school, education.major, education.degree, education.startDate]);
      if (educationKeys.has(key)) {
        summary.duplicatesSkipped += 1;
        continue;
      }

      await this.prisma.education.create({
        data: {
          profileId: profile.id,
          ...education,
        },
      });
      educationKeys.add(key);
      summary.educationsCreated += 1;
    }

    const careerKeys = new Set(
      profile.careers.map((career: any) => this.importKey([career.company, career.position, career.startDate])),
    );
    for (const career of normalized.careers) {
      const key = this.importKey([career.company, career.position, career.startDate]);
      if (careerKeys.has(key)) {
        summary.duplicatesSkipped += 1;
        continue;
      }

      await this.prisma.career.create({
        data: {
          profileId: profile.id,
          ...career,
        },
      });
      careerKeys.add(key);
      summary.careersCreated += 1;
    }

    const certificationKeys = new Set(
      profile.certifications.map((certification: any) => this.importKey([certification.name, certification.issuer, certification.issueDate])),
    );
    for (const certification of normalized.certifications) {
      const key = this.importKey([certification.name, certification.issuer, certification.issueDate]);
      if (certificationKeys.has(key)) {
        summary.duplicatesSkipped += 1;
        continue;
      }

      await this.prisma.certification.create({
        data: {
          profileId: profile.id,
          ...certification,
        },
      });
      certificationKeys.add(key);
      summary.certificationsCreated += 1;
    }

    const projectKeys = new Set(profile.projects.map((project: any) => this.importKey([project.name, project.startDate])));
    for (const project of normalized.projects) {
      const key = this.importKey([project.name, project.startDate]);
      if (projectKeys.has(key)) {
        summary.duplicatesSkipped += 1;
        continue;
      }

      await this.prisma.project.create({
        data: {
          profileId: profile.id,
          ...project,
          techStack: JSON.stringify(project.techStack),
        },
      });
      projectKeys.add(key);
      summary.projectsCreated += 1;
    }

    const skillKeys = new Set(profile.skills.map((skill: any) => skill.name.toLowerCase().replace(/\s+/g, '')));
    for (const skill of normalized.skills) {
      const key = skill.name.toLowerCase().replace(/\s+/g, '');
      if (skillKeys.has(key)) {
        summary.duplicatesSkipped += 1;
        continue;
      }

      await this.prisma.skill.create({
        data: {
          profileId: profile.id,
          ...skill,
        },
      });
      skillKeys.add(key);
      summary.skillsCreated += 1;
    }

    if (normalized.swotAnalysis) {
      const existingSwot = profile.swotAnalysis
        ? {
            strengths: parseJsonArray(profile.swotAnalysis.strengths),
            weaknesses: parseJsonArray(profile.swotAnalysis.weaknesses),
            opportunities: parseJsonArray(profile.swotAnalysis.opportunities),
            threats: parseJsonArray(profile.swotAnalysis.threats),
          }
        : {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: [],
          };
      const mergedSwot = {
        strengths: this.mergeStringArrays(existingSwot.strengths, normalized.swotAnalysis.strengths),
        weaknesses: this.mergeStringArrays(existingSwot.weaknesses, normalized.swotAnalysis.weaknesses),
        opportunities: this.mergeStringArrays(existingSwot.opportunities, normalized.swotAnalysis.opportunities),
        threats: this.mergeStringArrays(existingSwot.threats, normalized.swotAnalysis.threats),
      };
      const hasNewSwot =
        mergedSwot.strengths.length !== existingSwot.strengths.length ||
        mergedSwot.weaknesses.length !== existingSwot.weaknesses.length ||
        mergedSwot.opportunities.length !== existingSwot.opportunities.length ||
        mergedSwot.threats.length !== existingSwot.threats.length;

      if (hasNewSwot) {
        await this.prisma.swotAnalysis.upsert({
          where: { profileId: profile.id },
          update: {
            strengths: JSON.stringify(mergedSwot.strengths),
            weaknesses: JSON.stringify(mergedSwot.weaknesses),
            opportunities: JSON.stringify(mergedSwot.opportunities),
            threats: JSON.stringify(mergedSwot.threats),
          },
          create: {
            profileId: profile.id,
            strengths: JSON.stringify(mergedSwot.strengths),
            weaknesses: JSON.stringify(mergedSwot.weaknesses),
            opportunities: JSON.stringify(mergedSwot.opportunities),
            threats: JSON.stringify(mergedSwot.threats),
          },
        });
        summary.swotUpdated = true;
      }
    }

    await this.refreshProfileCompleteness(userId);

    return {
      profile: await this.getProfile(userId),
      imported: summary,
    };
  }

  async importResumeFile(
    userId: string,
    file: ResumeUploadFile,
    aiModel?: string,
  ) {
    const fileName = file.originalname ?? 'resume';
    const extractedText = (await this.extractTextFromResumeFile(file))
      .replace(/\u0000/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .trim();

    if (extractedText.length < 50) {
      throw new BadRequestException('이력서에서 충분한 텍스트를 읽지 못했습니다.');
    }

    const imported = await this.aiService.extractProfileFromResume(
      extractedText,
      resolveAiModel(aiModel),
      userId,
    );

    return this.applyImportedProfile(userId, imported, {
      fileName,
      extractedCharacters: extractedText.length,
    });
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
