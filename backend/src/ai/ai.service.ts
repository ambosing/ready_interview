import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { DEFAULT_AI_MODEL, parseAiModel, type AiGenerationModel } from './ai-models.js';

// Types ported from types.ts
export interface ProfileForGeneration {
  user: { name: string };
  bio: string | null;
  careers: any[];
  projects: any[];
  educations: any[];
  skills: any[];
}
export interface JobPostingForGeneration {
  title: string;
  company: string | null;
  content: string;
}
export interface MessageForInterview {
  role: 'USER' | 'INTERVIEWER';
  content: string;
}
export interface InterviewFeedbackResult {
  overallScore: number;
  categories: any[];
  summary: string;
  improvements: string[];
}
export interface JobPostingAnalysisResult {
  keywords: string[];
  requirements: string[];
  companyInfo: string;
}

interface OpenAiTextResponse {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
}

interface CodexOAuthPayload {
  access?: string;
  access_token?: string;
  token?: string;
  expires?: string | number;
  expires_at?: string | number;
  accountId?: string;
  account_id?: string;
}

@Injectable()
export class AiService {
  private formatDate(value: Date | null) {
    if (!value) return '현재';
    return `${value.getFullYear()}.${String(value.getMonth() + 1).padStart(2, '0')}`;
  }

  private formatPeriod(startDate: Date, endDate: Date | null) {
    return `${this.formatDate(startDate)} ~ ${this.formatDate(endDate)}`;
  }

  private profileToText(profile: ProfileForGeneration): string {
    const projects = profile.projects.map(p => 
      `- ${p.name} (${this.formatPeriod(p.startDate, p.endDate)})\n  역할: ${p.role}\n  기술: ${p.techStack.join(', ')}\n  내용: ${p.description}\n  성과: ${p.achievements || '없음'}`
    ).join('\n');

    const careers = profile.careers.map(c => 
      `- ${c.company} / ${c.position} (${this.formatPeriod(c.startDate, c.endDate)})\n  내용: ${c.description || '없음'}`
    ).join('\n');

    const educations = profile.educations.map(e => 
      `- ${e.school} / ${e.major} (${e.degree})\n  기간: ${this.formatPeriod(e.startDate, e.endDate)}`
    ).join('\n');

    const skills = profile.skills.map(s => `${s.name}(${s.proficiency})`).join(', ');

    return `
[사용자 프로필]
이름: ${profile.user.name}
자기소개: ${profile.bio || '없음'}

[경력]
${careers || '없음'}

[프로젝트]
${projects || '없음'}

[학력]
${educations || '없음'}

[기술 스택]
${skills || '없음'}
    `;
  }

  private async fetchJson<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(`AI provider request failed: ${response.status} ${message}`);
    }

    return response.json() as Promise<T>;
  }

  private outputText(data: OpenAiTextResponse): string {
    return data.output_text ?? data.output?.flatMap(item => item.content ?? []).map(content => content.text ?? '').join('') ?? '';
  }

  private parseCodexOAuthPayload(raw: string | undefined): CodexOAuthPayload | null {
    if (!raw) return null;

    try {
      return JSON.parse(raw) as CodexOAuthPayload;
    } catch {
      return null;
    }
  }

  private getCodexAccessToken(): string {
    if (process.env.OPENAI_CODEX_ACCESS_TOKEN) {
      return process.env.OPENAI_CODEX_ACCESS_TOKEN;
    }

    const inlinePayload = this.parseCodexOAuthPayload(process.env.OPENAI_CODEX_OAUTH_JSON);
    if (inlinePayload?.access || inlinePayload?.access_token || inlinePayload?.token) {
      return inlinePayload.access ?? inlinePayload.access_token ?? inlinePayload.token ?? '';
    }

    if (process.env.OPENAI_CODEX_OAUTH_FILE) {
      const filePayload = this.parseCodexOAuthPayload(readFileSync(process.env.OPENAI_CODEX_OAUTH_FILE, 'utf8'));
      if (filePayload?.access || filePayload?.access_token || filePayload?.token) {
        return filePayload.access ?? filePayload.access_token ?? filePayload.token ?? '';
      }
    }

    throw new Error('OPENAI_CODEX_ACCESS_TOKEN, OPENAI_CODEX_OAUTH_JSON, or OPENAI_CODEX_OAUTH_FILE is not configured');
  }

  private async generateText(prompt: string, aiModel: AiGenerationModel = DEFAULT_AI_MODEL, options: { systemInstruction?: string; json?: boolean } = {}) {
    const { provider, model } = parseAiModel(aiModel);

    if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

      const data = await this.fetchJson<OpenAiTextResponse>(
        'https://api.openai.com/v1/responses',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            instructions: options.systemInstruction,
            input: prompt,
            text: options.json ? { format: { type: 'json_object' } } : undefined,
          }),
        },
      );

      return this.outputText(data);
    }

    if (provider === 'openai-codex') {
      const accessToken = this.getCodexAccessToken();
      const responsesUrl = process.env.OPENAI_CODEX_RESPONSES_URL || 'https://chatgpt.com/backend-api/codex/responses';

      const data = await this.fetchJson<OpenAiTextResponse>(
        responsesUrl,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            instructions: options.systemInstruction,
            input: prompt,
            text: options.json ? { format: { type: 'json_object' } } : undefined,
          }),
        },
      );

      return this.outputText(data);
    }

    if (provider === 'anthropic') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

      const data = await this.fetchJson<{ content?: Array<{ type: string; text?: string }> }>(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            max_tokens: options.json ? 4096 : 8192,
            system: options.systemInstruction,
            messages: [{ role: 'user', content: prompt }],
          }),
        },
      );

      return data.content?.map(content => content.type === 'text' ? content.text ?? '' : '').join('') ?? '';
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const data = await this.fetchJson<{ candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }>(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: options.systemInstruction ? { parts: [{ text: options.systemInstruction }] } : undefined,
          generationConfig: options.json ? { responseMimeType: 'application/json' } : undefined,
        }),
      },
    );

    return data.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('') ?? '';
  }

  private parseJsonResponse<T>(text: string, fallback: T): T {
    try {
      return JSON.parse(text) as T;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return fallback;

      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return fallback;
      }
    }
  }

  async analyzeJobPosting(content: string, aiModel: AiGenerationModel = DEFAULT_AI_MODEL): Promise<JobPostingAnalysisResult> {
    const prompt = `
다음 채용 공고를 분석하여 핵심 키워드(최대 6개), 주요 요구사항(최대 4문장), 그리고 회사/직무에 대한 전반적인 요약 정보를 추출해 주세요.
결과는 반드시 JSON 형식으로만 응답해야 합니다.

채용 공고:
${content}

응답 형식 (JSON):
{
  "keywords": ["키워드1", "키워드2"],
  "requirements": ["요구사항1", "요구사항2"],
  "companyInfo": "회사가 중시하는 가치나 전반적인 요약 (1~2문장)"
}`;

    try {
      const text = await this.generateText(prompt, aiModel, { json: true });
      return this.parseJsonResponse(text || '{}', { keywords: [], requirements: [], companyInfo: '분석에 실패했습니다.' });
    } catch (e) {
      return { keywords: [], requirements: [], companyInfo: '분석에 실패했습니다.' };
    }
  }

  async generateResume(profile: ProfileForGeneration, jobPosting: JobPostingForGeneration, aiModel: AiGenerationModel = DEFAULT_AI_MODEL): Promise<string> {
    const prompt = `
당신은 최고의 커리어 컨설턴트이자 이력서 작성 전문가입니다.
사용자의 프로필과 지원하려는 채용 공고 정보를 바탕으로, 해당 직무에 가장 적합한 형태의 '맞춤형 이력서'를 Markdown 형식으로 작성해 주세요.

[채용 공고 정보]
회사: ${jobPosting.company || '미상'}
직무: ${jobPosting.title}
상세 내용:
${jobPosting.content}

${this.profileToText(profile)}

작성 지침:
1. Markdown 형식으로 작성 (# 이력서, ## 지원 요약, ## 경력 사항 등)
2. 채용 공고의 요구사항에 부합하는 사용자의 경험과 프로젝트를 우선적으로 강조할 것.
3. 없는 사실을 지어내지 말 것. 프로필에 있는 내용만 사용할 것.
4. 전문적이고 자신감 있는 어조를 사용할 것.
`;

    try {
      return await this.generateText(prompt, aiModel) || '# 이력서 생성 실패';
    } catch (e) {
      return '# 이력서 생성 실패';
    }
  }

  async generatePortfolio(profile: ProfileForGeneration, jobPosting: JobPostingForGeneration, aiModel: AiGenerationModel = DEFAULT_AI_MODEL): Promise<string> {
    const prompt = `
당신은 최고의 커리어 컨설턴트이자 포트폴리오 작성 전문가입니다.
사용자의 프로필과 지원하려는 채용 공고 정보를 바탕으로, 해당 직무에 가장 적합한 형태의 '맞춤형 포트폴리오(경력 기술서)'를 Markdown 형식으로 작성해 주세요.

[채용 공고 정보]
회사: ${jobPosting.company || '미상'}
직무: ${jobPosting.title}
상세 내용:
${jobPosting.content}

${this.profileToText(profile)}

작성 지침:
1. Markdown 형식으로 작성 (# 포트폴리오, ## 소개, ## 핵심 역량, ## 프로젝트 상세 등)
2. 단순 나열보다는 '문제 해결 과정'과 '구체적 성과(수치 등)'가 잘 드러나게 재구성할 것.
3. 채용 공고에 적합한 역량을 가장 먼저 배치할 것.
4. 없는 사실을 지어내지 말 것.
`;

    try {
      return await this.generateText(prompt, aiModel) || '# 포트폴리오 생성 실패';
    } catch (e) {
      return '# 포트폴리오 생성 실패';
    }
  }

  async generateInterviewerResponse(messages: MessageForInterview[], difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED', aiModel: AiGenerationModel = DEFAULT_AI_MODEL): Promise<string> {
    const systemInstruction = `
당신은 채용 면접관입니다. 사용자는 지원자입니다.
면접 난이도는 ${difficulty}입니다. (BASIC: 기초적인 직무/인성 질문, INTERMEDIATE: 실무 경험 기반의 구체적 질문, ADVANCED: 압박 면접, 엣지 케이스, 심도 깊은 기술/경험 검증)
지원자의 이전 답변을 읽고, 면접관으로서 자연스럽게 다음 질문이나 꼬리질문을 던지세요.
한 번에 하나의 질문만 던지며, 너무 길지 않게 대화하듯 작성하세요.
`;

    const prompt = messages.length > 0
      ? messages.map(m => `${m.role === 'USER' ? '지원자' : '면접관'}: ${m.content}`).join('\n\n')
      : '지원자: 면접을 시작하겠습니다.';

    try {
      return await this.generateText(prompt, aiModel, { systemInstruction }) || '답변을 생성하지 못했습니다.';
    } catch (e) {
      return '답변을 생성하지 못했습니다.';
    }
  }

  async generateInterviewFeedback(messages: MessageForInterview[], aiModel: AiGenerationModel = DEFAULT_AI_MODEL): Promise<InterviewFeedbackResult> {
    const chatHistory = messages.map(m => `${m.role === 'USER' ? '지원자' : '면접관'}: ${m.content}`).join('\n\n');
    
    const prompt = `
다음은 면접관과 지원자 간의 모의 면접 기록입니다.
지원자의 답변을 분석하여 면접 피드백을 JSON 형식으로 작성해 주세요.

[면접 기록]
${chatHistory}

[응답 JSON 형식]
{
  "overallScore": 85, // 0~100 사이의 총점
  "categories": [
    {
      "name": "논리성",
      "score": 80, // 0~100
      "feedback": "답변이 논리적으로 잘 구성되었는지에 대한 짧은 피드백"
    },
    {
      "name": "직무 적합성",
      "score": 90,
      "feedback": "직무 역량이 잘 드러나는지에 대한 짧은 피드백"
    },
    {
      "name": "커뮤니케이션",
      "score": 85,
      "feedback": "표현의 명확성에 대한 짧은 피드백"
    }
  ],
  "summary": "면접에 대한 전반적인 총평 (3~4문장)",
  "improvements": [
    "개선할 점 1",
    "개선할 점 2",
    "개선할 점 3"
  ]
}
`;

    try {
      const text = await this.generateText(prompt, aiModel, { json: true });
      return this.parseJsonResponse(text || '{}', {
        overallScore: 0,
        categories: [],
        summary: '피드백 생성에 실패했습니다.',
        improvements: []
      });
    } catch (e) {
      return {
        overallScore: 0,
        categories: [],
        summary: '피드백 생성에 실패했습니다.',
        improvements: []
      };
    }
  }
}
