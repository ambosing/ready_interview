import type { AiModel } from '@/types'

export type AiProvider = 'openai' | 'openai-codex' | 'anthropic' | 'gemini'

export type AiProviderConnection = {
  provider: AiProvider
  authType: 'api-key' | 'oauth'
  apiKey?: string
  accessToken?: string
  oauthJson?: string
  responsesUrl?: string
  connectedAt: string
}

export type AiProviderRequestConnection = Omit<AiProviderConnection, 'connectedAt'>

export const defaultAiModel: AiModel = 'gemini:gemini-3.1-pro-preview'
export const aiModelStorageKey = 'ready-interview-ai-model'
export const aiProviderConnectionStorageKey = 'ready-interview-ai-provider-connections'
export const aiProviderConnectionChangeEvent = 'ai-provider-connections-change'

export const aiProviderOptions: Array<{
  id: AiProvider
  label: string
  authType: AiProviderConnection['authType']
  description: string
}> = [
  {
    id: 'openai',
    label: 'GPT API',
    authType: 'api-key',
    description: 'OpenAI API 키',
  },
  {
    id: 'openai-codex',
    label: 'GPT OAuth',
    authType: 'oauth',
    description: 'Codex/ChatGPT 토큰',
  },
  {
    id: 'anthropic',
    label: 'Claude',
    authType: 'api-key',
    description: 'Anthropic API 키',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    authType: 'api-key',
    description: 'Google AI Studio API 키',
  },
]

export const aiModelOptions: Array<{
  value: AiModel
  provider: string
  providerId: AiProvider
  label: string
  description: string
}> = [
  {
    value: 'openai:gpt-5.5',
    provider: 'GPT API',
    providerId: 'openai',
    label: 'GPT-5.5',
    description: 'OpenAI API 키 과금',
  },
  {
    value: 'openai:gpt-5.4',
    provider: 'GPT API',
    providerId: 'openai',
    label: 'GPT-5.4',
    description: 'OpenAI API 키 과금',
  },
  {
    value: 'openai:gpt-5.4-mini',
    provider: 'GPT API',
    providerId: 'openai',
    label: 'GPT-5.4 mini',
    description: 'OpenAI API 키 과금',
  },
  {
    value: 'openai-codex:gpt-5.5',
    provider: 'GPT OAuth',
    providerId: 'openai-codex',
    label: 'GPT-5.5',
    description: 'Codex/ChatGPT 구독',
  },
  {
    value: 'openai-codex:gpt-5.4',
    provider: 'GPT OAuth',
    providerId: 'openai-codex',
    label: 'GPT-5.4',
    description: 'Codex/ChatGPT 구독',
  },
  {
    value: 'openai-codex:gpt-5.4-mini',
    provider: 'GPT OAuth',
    providerId: 'openai-codex',
    label: 'GPT-5.4 mini',
    description: 'Codex/ChatGPT 구독',
  },
  {
    value: 'anthropic:claude-opus-4-7',
    provider: 'Claude',
    providerId: 'anthropic',
    label: 'Claude Opus 4.7',
    description: '복잡한 추론',
  },
  {
    value: 'anthropic:claude-sonnet-4-6',
    provider: 'Claude',
    providerId: 'anthropic',
    label: 'Claude Sonnet 4.6',
    description: '속도/지능 균형',
  },
  {
    value: 'anthropic:claude-haiku-4-5-20251001',
    provider: 'Claude',
    providerId: 'anthropic',
    label: 'Claude Haiku 4.5',
    description: '근접 프론티어 속도',
  },
  {
    value: 'gemini:gemini-3.1-pro-preview',
    provider: 'Gemini',
    providerId: 'gemini',
    label: 'Gemini 3.1 Pro Preview',
    description: '에이전트/코딩 최적화',
  },
  {
    value: 'gemini:gemini-3.5-flash',
    provider: 'Gemini',
    providerId: 'gemini',
    label: 'Gemini 3.5 Flash',
    description: '지속 프론티어 성능',
  },
  {
    value: 'gemini:gemini-3.1-flash-lite',
    provider: 'Gemini',
    providerId: 'gemini',
    label: 'Gemini 3.1 Flash-Lite',
    description: '고속/대량 처리',
  },
]

const legacyAiModelMap: Partial<Record<string, AiModel>> = {
  'openai:gpt-5.2': 'openai:gpt-5.5',
  'openai:gpt-5-mini': 'openai:gpt-5.4-mini',
  'openai-codex:gpt-5.2': 'openai-codex:gpt-5.5',
  'openai-codex:gpt-5-mini': 'openai-codex:gpt-5.4-mini',
  'codex:gpt-5.5': 'openai-codex:gpt-5.5',
  'codex:gpt-5.4': 'openai-codex:gpt-5.4',
  'codex:gpt-5.4-mini': 'openai-codex:gpt-5.4-mini',
  'openai-codex/gpt-5.5': 'openai-codex:gpt-5.5',
  'openai-codex/gpt-5.4': 'openai-codex:gpt-5.4',
  'openai-codex/gpt-5.4-mini': 'openai-codex:gpt-5.4-mini',
  'anthropic:claude-sonnet-4-20250514': 'anthropic:claude-sonnet-4-6',
  'anthropic:claude-3-5-haiku-20241022': 'anthropic:claude-haiku-4-5-20251001',
  'gemini:gemini-2.5-pro': 'gemini:gemini-3.1-pro-preview',
  'gemini:gemini-2.5-flash': 'gemini:gemini-3.5-flash',
  'gemini-3.1-pro-preview': 'gemini:gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite-preview': 'gemini:gemini-3.1-flash-lite',
}

export function getStoredAiModel(): AiModel {
  if (typeof window === 'undefined') {
    return defaultAiModel
  }

  const value = window.localStorage.getItem(aiModelStorageKey)
  if (value && legacyAiModelMap[value]) {
    setStoredAiModel(legacyAiModelMap[value])
    return legacyAiModelMap[value]
  }

  return aiModelOptions.some((option) => option.value === value) ? value as AiModel : defaultAiModel
}

export function setStoredAiModel(value: AiModel) {
  window.localStorage.setItem(aiModelStorageKey, value)
  window.dispatchEvent(new CustomEvent('ai-model-change', { detail: value }))
}

function isAiProvider(value: string): value is AiProvider {
  return aiProviderOptions.some((provider) => provider.id === value)
}

export function getAiProviderIdFromModel(value: AiModel): AiProvider {
  const provider = value.split(':')[0]
  return isAiProvider(provider) ? provider : 'gemini'
}

function normalizeConnection(value: unknown): AiProviderConnection | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<AiProviderConnection>
  if (!candidate.provider || !isAiProvider(candidate.provider)) {
    return null
  }

  if (candidate.authType !== 'api-key' && candidate.authType !== 'oauth') {
    return null
  }

  return {
    provider: candidate.provider,
    authType: candidate.authType,
    apiKey: candidate.apiKey,
    accessToken: candidate.accessToken,
    oauthJson: candidate.oauthJson,
    responsesUrl: candidate.responsesUrl,
    connectedAt: candidate.connectedAt ?? new Date().toISOString(),
  }
}

export function getStoredAiProviderConnections(): Partial<Record<AiProvider, AiProviderConnection>> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(aiProviderConnectionStorageKey) ?? '{}') as Record<string, unknown>

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([provider, connection]) => [provider, normalizeConnection(connection)] as const)
        .filter((entry): entry is [AiProvider, AiProviderConnection] => isAiProvider(entry[0]) && entry[1] !== null),
    )
  } catch {
    return {}
  }
}

export function getStoredAiProviderConnection(provider: AiProvider) {
  return getStoredAiProviderConnections()[provider] ?? null
}

export function setStoredAiProviderConnection(connection: AiProviderConnection) {
  const connections = getStoredAiProviderConnections()
  connections[connection.provider] = connection
  window.localStorage.setItem(aiProviderConnectionStorageKey, JSON.stringify(connections))
  window.dispatchEvent(new CustomEvent(aiProviderConnectionChangeEvent, { detail: connections }))
}

export function removeStoredAiProviderConnection(provider: AiProvider) {
  const connections = getStoredAiProviderConnections()
  delete connections[provider]
  window.localStorage.setItem(aiProviderConnectionStorageKey, JSON.stringify(connections))
  window.dispatchEvent(new CustomEvent(aiProviderConnectionChangeEvent, { detail: connections }))
}

export function getAiProviderConnectionForModel(aiModel: AiModel): AiProviderRequestConnection | undefined {
  const provider = getAiProviderIdFromModel(aiModel)
  const connection = getStoredAiProviderConnection(provider)

  if (!connection) {
    return undefined
  }

  if (connection.authType === 'api-key' && connection.apiKey?.trim()) {
    return {
      provider,
      authType: 'api-key',
      apiKey: connection.apiKey.trim(),
    }
  }

  if (connection.authType === 'oauth' && (connection.accessToken?.trim() || connection.oauthJson?.trim())) {
    return {
      provider,
      authType: 'oauth',
      accessToken: connection.accessToken?.trim() || undefined,
      oauthJson: connection.oauthJson?.trim() || undefined,
      responsesUrl: connection.responsesUrl?.trim() || undefined,
    }
  }

  return undefined
}
