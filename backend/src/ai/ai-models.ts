export type AiProvider = 'openai' | 'openai-codex' | 'anthropic' | 'gemini';

export type AiGenerationModel =
  | 'openai:gpt-5.5'
  | 'openai:gpt-5.4'
  | 'openai:gpt-5.4-mini'
  | 'openai-codex:gpt-5.5'
  | 'openai-codex:gpt-5.4'
  | 'openai-codex:gpt-5.4-mini'
  | 'anthropic:claude-opus-4-7'
  | 'anthropic:claude-sonnet-4-6'
  | 'anthropic:claude-haiku-4-5-20251001'
  | 'gemini:gemini-3.1-pro-preview'
  | 'gemini:gemini-3.5-flash'
  | 'gemini:gemini-3.1-flash-lite';

export const DEFAULT_AI_MODEL: AiGenerationModel = 'gemini:gemini-3.1-pro-preview';

export const AI_GENERATION_MODELS = [
  'openai:gpt-5.5',
  'openai:gpt-5.4',
  'openai:gpt-5.4-mini',
  'openai-codex:gpt-5.5',
  'openai-codex:gpt-5.4',
  'openai-codex:gpt-5.4-mini',
  'anthropic:claude-opus-4-7',
  'anthropic:claude-sonnet-4-6',
  'anthropic:claude-haiku-4-5-20251001',
  'gemini:gemini-3.1-pro-preview',
  'gemini:gemini-3.5-flash',
  'gemini:gemini-3.1-flash-lite',
] as const satisfies readonly AiGenerationModel[];

export function resolveAiModel(aiModel?: string): AiGenerationModel {
  if (AI_GENERATION_MODELS.includes(aiModel as AiGenerationModel)) {
    return aiModel as AiGenerationModel;
  }

  if (aiModel === 'gemini-3.1-pro-preview') {
    return 'gemini:gemini-3.1-pro-preview';
  }

  if (aiModel === 'gemini-3.1-flash-lite-preview') {
    return 'gemini:gemini-3.1-flash-lite';
  }

  if (aiModel === 'openai:gpt-5.2') {
    return 'openai:gpt-5.5';
  }

  if (aiModel === 'openai:gpt-5-mini') {
    return 'openai:gpt-5.4-mini';
  }

  if (aiModel === 'openai-codex:gpt-5.2') {
    return 'openai-codex:gpt-5.5';
  }

  if (aiModel === 'openai-codex:gpt-5-mini') {
    return 'openai-codex:gpt-5.4-mini';
  }

  if (aiModel === 'codex:gpt-5.5' || aiModel === 'openai-codex/gpt-5.5') {
    return 'openai-codex:gpt-5.5';
  }

  if (aiModel === 'codex:gpt-5.4' || aiModel === 'openai-codex/gpt-5.4') {
    return 'openai-codex:gpt-5.4';
  }

  if (aiModel === 'codex:gpt-5.4-mini' || aiModel === 'openai-codex/gpt-5.4-mini') {
    return 'openai-codex:gpt-5.4-mini';
  }

  if (aiModel === 'anthropic:claude-sonnet-4-20250514') {
    return 'anthropic:claude-sonnet-4-6';
  }

  if (aiModel === 'anthropic:claude-3-5-haiku-20241022') {
    return 'anthropic:claude-haiku-4-5-20251001';
  }

  if (aiModel === 'gemini:gemini-2.5-pro') {
    return 'gemini:gemini-3.1-pro-preview';
  }

  if (aiModel === 'gemini:gemini-2.5-flash') {
    return 'gemini:gemini-3.5-flash';
  }

  return DEFAULT_AI_MODEL;
}

export function parseAiModel(aiModel?: string) {
  const resolved = resolveAiModel(aiModel);
  const [provider, ...modelParts] = resolved.split(':');

  return {
    id: resolved,
    provider: provider as AiProvider,
    model: modelParts.join(':'),
  };
}
