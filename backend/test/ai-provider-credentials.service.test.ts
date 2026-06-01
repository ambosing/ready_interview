import { BadRequestException } from '@nestjs/common';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AiProviderCredentialsService } from '../src/ai/ai-provider-credentials.service.js';
import {
  aiModelBodySchema,
  aiProviderCredentialSaveSchema,
  documentGenerateSchema,
  interviewMessageSchema,
  parseBody,
  profileResumeImportSchema,
} from '../src/utils/validation.js';

type StoredCredential = {
  userId: string;
  provider: string;
  authType: string;
  encryptedPayload: string;
  connectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function createPrismaMock() {
  const credentials: StoredCredential[] = [];

  return {
    credentials,
    prisma: {
      aiProviderCredential: {
        async findMany({ where }: { where: { userId: string } }) {
          return credentials.filter((credential) => credential.userId === where.userId);
        },
        async findUnique({
          where,
        }: {
          where: { userId_provider: { userId: string; provider: string } };
        }) {
          return credentials.find(
            (credential) =>
              credential.userId === where.userId_provider.userId &&
              credential.provider === where.userId_provider.provider,
          ) ?? null;
        },
        async upsert({
          where,
          update,
          create,
        }: {
          where: { userId_provider: { userId: string; provider: string } };
          update: Partial<StoredCredential>;
          create: Omit<StoredCredential, 'connectedAt' | 'createdAt' | 'updatedAt'>;
        }) {
          const existing = credentials.find(
            (credential) =>
              credential.userId === where.userId_provider.userId &&
              credential.provider === where.userId_provider.provider,
          );
          const now = new Date();

          if (existing) {
            Object.assign(existing, update, { updatedAt: now });
            return existing;
          }

          const credential = {
            ...create,
            connectedAt: now,
            createdAt: now,
            updatedAt: now,
          };
          credentials.push(credential);
          return credential;
        },
        async deleteMany({ where }: { where: { userId: string; provider: string } }) {
          const before = credentials.length;
          for (let index = credentials.length - 1; index >= 0; index -= 1) {
            const credential = credentials[index];
            if (credential.userId === where.userId && credential.provider === where.provider) {
              credentials.splice(index, 1);
            }
          }
          return { count: before - credentials.length };
        },
      },
    },
  };
}

describe('AI provider credential security', () => {
  it('stores provider credentials encrypted and only exposes masked status values', async () => {
    const { credentials, prisma } = createPrismaMock();
    const service = new AiProviderCredentialsService(prisma as any);

    await service.save('user-1', 'gemini', {
      authType: 'api-key',
      apiKey: 'test-gemini-key-1234567890',
    });

    assert.equal(credentials.length, 1);
    assert.equal(credentials[0].provider, 'gemini');
    assert.equal(credentials[0].authType, 'api-key');
    assert.equal(credentials[0].encryptedPayload.includes('test-gemini-key-1234567890'), false);

    const statuses = await service.listStatuses('user-1');
    const geminiStatus = statuses.find((status) => status.provider === 'gemini');

    assert.deepEqual(
      {
        provider: geminiStatus?.provider,
        authType: geminiStatus?.authType,
        connected: geminiStatus?.connected,
        maskedSecret: geminiStatus?.maskedSecret,
      },
      {
        provider: 'gemini',
        authType: 'api-key',
        connected: true,
        maskedSecret: '•••• 7890',
      },
    );

    const connection = await service.getConnection('user-1', 'gemini');
    assert.equal(connection?.apiKey, 'test-gemini-key-1234567890');
  });

  it('rejects mismatched auth types and invalid OAuth JSON', async () => {
    const { prisma } = createPrismaMock();
    const service = new AiProviderCredentialsService(prisma as any);

    await assert.rejects(
      () =>
        service.save('user-1', 'gemini', {
          authType: 'oauth',
          accessToken: 'token',
        }),
      BadRequestException,
    );

    await assert.rejects(
      () =>
        service.save('user-1', 'openai-codex', {
          authType: 'oauth',
          oauthJson: '{"refresh":"only"}',
        }),
      BadRequestException,
    );
  });

  it('strips legacy request-scoped provider credentials from AI request payloads', () => {
    const legacyConnection = {
      provider: 'gemini',
      authType: 'api-key',
      apiKey: 'should-not-reach-ai-services',
      responsesUrl: 'https://attacker.example/responses',
    };

    const parsedModelBody = parseBody(aiModelBodySchema, {
      aiModel: 'gemini:gemini-3.1-pro-preview',
      aiProviderConnection: legacyConnection,
    });
    const parsedResumeImport = parseBody(profileResumeImportSchema, {
      aiModel: 'gemini:gemini-3.1-pro-preview',
      aiProviderConnection: legacyConnection,
    });
    const parsedDocumentGenerate = parseBody(documentGenerateSchema, {
      type: 'RESUME',
      jobPostingId: 'job-1',
      aiModel: 'gemini:gemini-3.1-pro-preview',
      aiProviderConnection: legacyConnection,
    });
    const parsedInterviewMessage = parseBody(interviewMessageSchema, {
      content: '질문에 답변합니다.',
      aiModel: 'gemini:gemini-3.1-pro-preview',
      aiProviderConnection: legacyConnection,
    });

    for (const parsed of [
      parsedModelBody,
      parsedResumeImport,
      parsedDocumentGenerate,
      parsedInterviewMessage,
    ]) {
      assert.equal(Object.hasOwn(parsed as object, 'aiProviderConnection'), false);
    }
  });

  it('does not accept user-controlled Responses API URLs on credential saves', () => {
    const parsed = parseBody(aiProviderCredentialSaveSchema, {
      authType: 'oauth',
      accessToken: 'codex-token',
      responsesUrl: 'https://attacker.example/responses',
    });

    assert.equal(Object.hasOwn(parsed as object, 'responsesUrl'), false);
  });
});
