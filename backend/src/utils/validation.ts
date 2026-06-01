import { BadRequestException } from '@nestjs/common';
import { z, ZodError } from 'zod';

const optionalString = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().trim().nullable(),
);

const optionalUrl = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().trim().url().nullable(),
);

const dateValue = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? value : parsed;
}, z.date());

const nullableDateValue = z.preprocess((value) => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return value;

  const parsed = new Date(value.trim());
  return Number.isNaN(parsed.getTime()) ? value : parsed;
}, z.date().nullable());

const stringArray = z.array(z.string().trim().min(1)).default([]);

const aiModelSchema = z.string().trim().min(1).optional();
const aiProviderCredentialSaveSchemaBase = z.object({
  authType: z.enum(['api-key', 'oauth']),
  apiKey: z.string().trim().min(1).optional(),
  accessToken: z.string().trim().min(1).optional(),
  oauthJson: z.string().trim().min(1).optional(),
});

export const aiProviderCredentialSaveSchema = aiProviderCredentialSaveSchemaBase.superRefine((value, ctx) => {
  if (value.authType === 'api-key' && !value.apiKey) {
    ctx.addIssue({
      code: 'custom',
      path: ['apiKey'],
      message: 'API key is required',
    });
  }

  if (value.authType === 'oauth' && !value.accessToken && !value.oauthJson) {
    ctx.addIssue({
      code: 'custom',
      path: ['accessToken'],
      message: 'OAuth access token or JSON is required',
    });
  }
});

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  try {
    return schema.parse(body ?? {});
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    throw error;
  }
}

export const signupSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const updateProfileSchema = z.object({
  phone: optionalString.optional(),
  address: optionalString.optional(),
  bio: optionalString.optional(),
  profileImageUrl: optionalUrl.optional(),
});

export const educationCreateSchema = z.object({
  school: z.string().trim().min(1).max(200),
  major: z.string().trim().min(1).max(200),
  degree: z.string().trim().min(1).max(100),
  startDate: dateValue,
  endDate: nullableDateValue.optional(),
  description: optionalString.optional(),
});

export const educationUpdateSchema = educationCreateSchema.partial();

export const careerCreateSchema = z.object({
  company: z.string().trim().min(1).max(200),
  position: z.string().trim().min(1).max(200),
  department: optionalString.optional(),
  startDate: dateValue,
  endDate: nullableDateValue.optional(),
  isCurrent: z.boolean().optional(),
  description: optionalString.optional(),
});

export const careerUpdateSchema = careerCreateSchema.partial();

export const certificationCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  issuer: z.string().trim().min(1).max(200),
  issueDate: dateValue,
  expiryDate: nullableDateValue.optional(),
  credentialId: optionalString.optional(),
});

export const certificationUpdateSchema = certificationCreateSchema.partial();

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1),
  role: z.string().trim().min(1).max(200),
  techStack: stringArray,
  startDate: dateValue,
  endDate: nullableDateValue.optional(),
  achievements: optionalString.optional(),
  url: optionalUrl.optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const skillCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: optionalString.optional(),
  proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
});

export const skillUpdateSchema = skillCreateSchema.partial();

export const swotUpdateSchema = z.object({
  strengths: stringArray,
  weaknesses: stringArray,
  opportunities: stringArray,
  threats: stringArray,
});

export const jobPostingCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  company: optionalString.optional(),
  url: optionalUrl.optional(),
  content: z.string().trim().min(200),
});

export const jobPostingUpdateSchema = jobPostingCreateSchema.partial();

export const aiModelBodySchema = z.object({
  aiModel: aiModelSchema,
});

export const profileResumeImportSchema = z.object({
  aiModel: aiModelSchema,
});

export const documentGenerateSchema = z.object({
  type: z.enum(['RESUME', 'PORTFOLIO']),
  jobPostingId: z.string().trim().min(1),
  aiModel: aiModelSchema,
});

export const documentUpdateSchema = z.object({
  content: z.string().trim().min(1),
});

export const applicationCreateSchema = z.object({
  jobPostingId: z.string().trim().min(1),
  status: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']).default('APPLIED'),
  notes: optionalString.optional(),
});

export const applicationListQuerySchema = z.object({
  status: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
});

export const applicationUpdateSchema = z.object({
  status: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
  notes: optionalString.optional(),
});

export const interviewCreateSchema = z.object({
  applicationId: z.string().trim().min(1),
  type: z.enum(['TEXT', 'VOICE']).default('TEXT'),
  difficulty: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).default('INTERMEDIATE'),
});

export const interviewMessageSchema = z.object({
  content: z.string().trim().min(1),
  aiModel: aiModelSchema,
});

export const selfEvaluationCreateSchema = z.object({
  applicationId: z.string().trim().min(1),
  performance: z.coerce.number().int().min(0).max(100),
  strengths: optionalString.optional(),
  improvements: optionalString.optional(),
  questionsAsked: optionalString.optional(),
  notes: optionalString.optional(),
});

export const selfEvaluationUpdateSchema = selfEvaluationCreateSchema.omit({ applicationId: true }).partial();
