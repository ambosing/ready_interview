import { BadRequestException, Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { config } from '../config/index.js';
import type { AiProvider } from './ai-models.js';

export type AiProviderCredentialAuthType = 'api-key' | 'oauth';

export interface AiProviderCredentialPayload {
  apiKey?: string;
  accessToken?: string;
  oauthJson?: string;
}

export interface AiProviderCredentialInput extends AiProviderCredentialPayload {
  authType: AiProviderCredentialAuthType;
}

export interface AiProviderConnection {
  provider: AiProvider;
  authType: AiProviderCredentialAuthType;
  apiKey?: string;
  accessToken?: string;
  oauthJson?: string;
}

const providerAuthTypes: Record<AiProvider, AiProviderCredentialAuthType> = {
  openai: 'api-key',
  'openai-codex': 'oauth',
  anthropic: 'api-key',
  gemini: 'api-key',
};

@Injectable()
export class AiProviderCredentialsService {
  private readonly encryptionKey = createHash('sha256')
    .update(config.aiProviderCredentialSecret)
    .digest();

  constructor(private readonly prisma: PrismaService) {}

  private assertProvider(provider: string): asserts provider is AiProvider {
    if (!Object.hasOwn(providerAuthTypes, provider)) {
      throw new BadRequestException('Unsupported AI provider');
    }
  }

  private encrypt(payload: AiProviderCredentialPayload) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
  }

  private decrypt(value: string): AiProviderCredentialPayload | null {
    const [ivValue, tagValue, encryptedValue] = value.split('.');
    if (!ivValue || !tagValue || !encryptedValue) return null;

    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey,
        Buffer.from(ivValue, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedValue, 'base64url')),
        decipher.final(),
      ]).toString('utf8');

      return JSON.parse(decrypted) as AiProviderCredentialPayload;
    } catch {
      return null;
    }
  }

  private maskSecret(value?: string) {
    const normalized = value?.trim();
    if (!normalized) return null;

    return normalized.length > 8 ? `•••• ${normalized.slice(-4)}` : '••••';
  }

  private validateOAuthJson(value?: string) {
    if (!value) return;

    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      if (
        typeof parsed.access === 'string' ||
        typeof parsed.access_token === 'string' ||
        typeof parsed.token === 'string'
      ) {
        return;
      }
    } catch {
      // Fall through to the common validation error below.
    }

    throw new BadRequestException('OAuth JSON must include access, access_token, or token');
  }

  async listStatuses(userId: string) {
    const credentials = await this.prisma.aiProviderCredential.findMany({
      where: { userId },
    });
    const credentialMap = new Map(credentials.map((credential) => [credential.provider, credential]));

    return Object.entries(providerAuthTypes).map(([provider, authType]) => {
      const credential = credentialMap.get(provider);
      const payload = credential ? this.decrypt(credential.encryptedPayload) : null;
      const maskedSecret = authType === 'oauth'
        ? this.maskSecret(payload?.accessToken ?? payload?.oauthJson)
        : this.maskSecret(payload?.apiKey);

      return {
        provider,
        authType,
        connected: Boolean(credential),
        connectedAt: credential?.connectedAt ?? null,
        maskedSecret,
      };
    });
  }

  async save(userId: string, provider: string, input: AiProviderCredentialInput) {
    this.assertProvider(provider);

    const expectedAuthType = providerAuthTypes[provider];
    if (input.authType !== expectedAuthType) {
      throw new BadRequestException('AI provider auth type does not match provider');
    }

    const payload: AiProviderCredentialPayload = input.authType === 'oauth'
      ? {
          accessToken: input.accessToken?.trim() || undefined,
          oauthJson: input.oauthJson?.trim() || undefined,
        }
      : {
          apiKey: input.apiKey?.trim() || undefined,
        };

    if (input.authType === 'api-key' && !payload.apiKey) {
      throw new BadRequestException('API key is required');
    }

    if (input.authType === 'oauth' && !payload.accessToken && !payload.oauthJson) {
      throw new BadRequestException('OAuth access token or JSON is required');
    }

    this.validateOAuthJson(payload.oauthJson);

    await this.prisma.aiProviderCredential.upsert({
      where: {
        userId_provider: { userId, provider },
      },
      update: {
        authType: input.authType,
        encryptedPayload: this.encrypt(payload),
        connectedAt: new Date(),
      },
      create: {
        userId,
        provider,
        authType: input.authType,
        encryptedPayload: this.encrypt(payload),
      },
    });
  }

  async remove(userId: string, provider: string) {
    this.assertProvider(provider);

    await this.prisma.aiProviderCredential.deleteMany({
      where: { userId, provider },
    });
  }

  async getConnection(userId: string | undefined, provider: AiProvider): Promise<AiProviderConnection | undefined> {
    if (!userId) return undefined;

    const credential = await this.prisma.aiProviderCredential.findUnique({
      where: {
        userId_provider: { userId, provider },
      },
    });
    if (!credential) return undefined;

    const payload = this.decrypt(credential.encryptedPayload);
    if (!payload) return undefined;

    return {
      provider,
      authType: credential.authType as AiProviderCredentialAuthType,
      apiKey: payload.apiKey,
      accessToken: payload.accessToken,
      oauthJson: payload.oauthJson,
    };
  }
}
