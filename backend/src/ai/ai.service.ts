import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { DEFAULT_AI_MODEL, parseAiModel, type AiGenerationModel, type AiProvider } from './ai-models.js';

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
export interface ExpectedInterviewQuestion {
  question: string;
  guide: string;
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

export interface AiProviderConnection {
  provider: AiProvider;
  authType: 'api-key' | 'oauth';
  apiKey?: string;
  accessToken?: string;
  oauthJson?: string;
  responsesUrl?: string;
}

interface GenerateTextOptions {
  systemInstruction?: string;
  json?: boolean;
  aiProviderConnection?: AiProviderConnection;
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

  private fallbackJobPostingAnalysis(content: string): JobPostingAnalysisResult {
    const keywordCandidates = [
      'React',
      'TypeScript',
      'API 연동',
      '상태관리',
      '테스트',
      '성능 최적화',
      '협업',
      '문서화',
      '클라우드',
      '사용자 경험',
    ];
    const lowerContent = content.toLowerCase();
    const matched = keywordCandidates.filter((keyword) => lowerContent.includes(keyword.toLowerCase()));
    const keywords = (matched.length > 0 ? matched : keywordCandidates).slice(0, 6);

    return {
      keywords,
      requirements: [
        '채용 공고의 핵심 요구사항을 빠르게 파악하고, 관련 경험을 구체적인 성과 중심으로 설명해야 합니다.',
        '프론트엔드 구현력뿐 아니라 백엔드 API와 안정적으로 연동한 경험을 강조하는 것이 좋습니다.',
        '협업, 문서화, 테스트 자동화처럼 반복 가능한 개발 품질을 높인 사례를 준비하세요.',
        '사용자 경험이나 성능 개선을 수치와 전후 비교로 설명하면 직무 적합성이 더 선명해집니다.',
      ],
      companyInfo: '이 공고는 제품 완성도와 협업 역량을 함께 보는 포지션입니다. 지원자는 기술 선택의 이유와 실제 사용자 가치로 연결한 경험을 준비하는 것이 좋습니다.',
    };
  }

  private fallbackResume(profile: ProfileForGeneration, jobPosting: JobPostingForGeneration) {
    const skills = profile.skills.map((skill) => skill.name).slice(0, 6).join(', ') || '직무 관련 기술';
    const career = profile.careers[0];
    const project = profile.projects[0];

    return `# ${profile.user.name} 맞춤형 이력서

## 지원 요약
${jobPosting.company || '지원 기업'}의 ${jobPosting.title} 포지션에 맞춰, 사용자의 실제 프로필을 바탕으로 작성한 MVP mock 이력서입니다. 핵심 역량은 ${skills}이며, 채용 공고에서 요구하는 문제 해결력과 협업 역량을 중심으로 구성했습니다.

## 핵심 역량
- 공고 요구사항을 제품 기능과 사용자 경험으로 연결하는 실행력
- 백엔드 API와 프론트엔드 화면을 안정적으로 연결하는 구현 역량
- 작업 내용을 문서화하고 팀과 빠르게 조율하는 협업 태도

## 경력
${career ? `### ${career.company} / ${career.position}\n- 기간: ${this.formatPeriod(career.startDate, career.endDate)}\n- 주요 내용: ${career.description || '제품 개발과 운영 개선에 참여했습니다.'}` : '- 등록된 경력 정보가 없어 프로젝트와 기술 역량 중심으로 작성했습니다.'}

## 프로젝트
${project ? `### ${project.name}\n- 역할: ${project.role}\n- 기술: ${project.techStack.join(', ') || '등록된 기술 없음'}\n- 내용: ${project.description}\n- 성과: ${project.achievements || '사용자 문제를 해결하는 기능 구현에 기여했습니다.'}` : '- 등록된 프로젝트 정보가 없어 채용 공고 기반의 역량 요약을 우선 배치했습니다.'}

## 지원 직무 적합성
${jobPosting.content.slice(0, 180)}...

위 요구사항에 맞춰 API 연동, 품질 개선, 협업 경험을 면접 답변에서도 같은 흐름으로 연결하면 좋습니다.`;
  }

  private fallbackPortfolio(profile: ProfileForGeneration, jobPosting: JobPostingForGeneration) {
    const projects = profile.projects.length > 0
      ? profile.projects.map((project) => `### ${project.name}\n- 역할: ${project.role}\n- 기술: ${project.techStack.join(', ') || '등록된 기술 없음'}\n- 문제 해결: ${project.description}\n- 결과: ${project.achievements || '기능 완성도와 사용자 흐름 개선에 기여했습니다.'}`).join('\n\n')
      : '### 대표 프로젝트\n- 아직 등록된 프로젝트가 없어 공고 기반 포트폴리오 초안을 생성했습니다.\n- 실제 프로젝트를 추가하면 문제, 행동, 결과 구조로 더 정교하게 다듬을 수 있습니다.';

    return `# ${jobPosting.company || '지원 기업'} ${jobPosting.title} 맞춤형 포트폴리오

## 소개
${profile.user.name}님의 프로필을 기반으로 생성한 MVP mock 포트폴리오입니다. 채용 공고의 요구사항에 맞춰 기술 선택, API 연동, 협업 방식, 결과 중심으로 정리했습니다.

## 핵심 역량
- 요구사항을 화면 흐름과 데이터 구조로 빠르게 번역하는 능력
- React/TypeScript 기반 UI 구현과 백엔드 API 연동 경험
- 문서화와 회고를 통한 지속적인 개선 역량

## 프로젝트 상세
${projects}

## 공고 대응 전략
공고에서 강조하는 내용 중 반복적으로 등장하는 기술과 협업 키워드를 자기소개, 프로젝트 설명, 면접 답변에 같은 언어로 반영하세요. 특히 “무엇을 만들었는지”보다 “왜 그렇게 만들었고 어떤 변화가 있었는지”를 먼저 보여주는 구성이 적합합니다.`;
  }

  private fallbackInterviewerResponse(messages: MessageForInterview[], difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED') {
    const userMessages = messages.filter((message) => message.role === 'USER');
    const turn = userMessages.length;

    if (turn <= 1) {
      return '좋습니다. 방금 말씀하신 경험에서 본인이 직접 맡았던 역할과 가장 어려웠던 의사결정을 조금 더 구체적으로 설명해 주세요.';
    }

    if (difficulty === 'ADVANCED') {
      return '그 선택이 실패했을 가능성도 있었을 텐데요. 당시 고려했던 대안과, 결과를 검증하기 위해 어떤 지표를 봤는지 말씀해 주세요.';
    }

    if (difficulty === 'BASIC') {
      return '그 경험을 통해 배운 점은 무엇이고, 다음 프로젝트에서 어떻게 적용했는지 이야기해 주세요.';
    }

    return '말씀하신 해결 과정에서 팀과 조율한 부분이 궁금합니다. 의견 충돌이나 일정 압박이 있었다면 어떻게 정리했나요?';
  }

  private fallbackInterviewFeedback(messages: MessageForInterview[]): InterviewFeedbackResult {
    const answerCount = messages.filter((message) => message.role === 'USER').length;
    const baseScore = answerCount >= 3 ? 82 : answerCount >= 1 ? 70 : 55;

    return {
      overallScore: baseScore,
      categories: [
        {
          name: '논리성',
          score: Math.min(baseScore + 4, 100),
          feedback: '답변의 흐름은 자연스럽지만 상황, 행동, 결과를 더 분리하면 전달력이 좋아집니다.',
        },
        {
          name: '직무 적합성',
          score: baseScore,
          feedback: '직무와 연결되는 경험을 언급했습니다. 공고 키워드와 더 직접적으로 연결해 보세요.',
        },
        {
          name: '커뮤니케이션',
          score: Math.max(baseScore - 3, 0),
          feedback: '핵심 메시지는 분명합니다. 수치나 전후 비교를 추가하면 설득력이 올라갑니다.',
        },
      ],
      summary: '전반적으로 경험 기반 답변의 방향은 좋습니다. 다만 문제 상황, 본인의 기여, 결과 지표를 더 구체적으로 제시하면 면접관이 역량을 빠르게 판단할 수 있습니다.',
      improvements: [
        '답변 첫 문장에 결론을 먼저 말한 뒤 배경을 설명하세요.',
        '성과를 가능하면 수치, 기간, 사용자 반응으로 표현하세요.',
        '공고의 핵심 키워드를 답변 안에 자연스럽게 반복하세요.',
      ],
    };
  }

  private fallbackExpectedQuestions(jobPosting: JobPostingForGeneration): ExpectedInterviewQuestion[] {
    const company = jobPosting.company || '지원 기업';
    const role = jobPosting.title;

    return [
      {
        question: `${company}의 ${role} 포지션에 지원한 이유와 본인이 가장 잘 기여할 수 있는 부분은 무엇인가요?`,
        guide: '회사/직무 관심 이유를 한 문장으로 정리한 뒤, 본인의 경험 1개와 연결하세요.',
      },
      {
        question: '최근 프로젝트에서 백엔드 API와 프론트엔드 화면을 연동하며 겪은 어려움은 무엇이었나요?',
        guide: '문제 상황, 원인 파악, 해결 방법, 결과를 순서대로 말하면 좋습니다.',
      },
      {
        question: '사용자 경험이나 성능을 개선한 경험이 있다면 어떤 지표로 효과를 확인했나요?',
        guide: '개선 전후 수치, 사용자 반응, 배운 점을 포함해 답변하세요.',
      },
      {
        question: '팀 내 의견이 갈렸을 때 어떤 기준으로 의사결정을 도왔나요?',
        guide: '기술적 근거와 사용자 가치, 일정 리스크를 함께 고려한 사례를 준비하세요.',
      },
      {
        question: '입사 후 첫 한 달 동안 이 제품이나 팀에 어떤 방식으로 적응하고 기여하고 싶나요?',
        guide: '학습 계획, 코드베이스 파악 방식, 작은 개선부터 만드는 실행력을 보여주세요.',
      },
    ];
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

  private getProviderConnection(provider: AiProvider, connection?: AiProviderConnection) {
    return connection?.provider === provider ? connection : undefined;
  }

  private getCodexAccessToken(connection?: AiProviderConnection): string {
    if (connection?.accessToken) {
      return connection.accessToken;
    }

    const requestPayload = this.parseCodexOAuthPayload(connection?.oauthJson);
    if (requestPayload?.access || requestPayload?.access_token || requestPayload?.token) {
      return requestPayload.access ?? requestPayload.access_token ?? requestPayload.token ?? '';
    }

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

  private async generateText(prompt: string, aiModel: AiGenerationModel = DEFAULT_AI_MODEL, options: GenerateTextOptions = {}) {
    const { provider, model } = parseAiModel(aiModel);
    const providerConnection = this.getProviderConnection(provider, options.aiProviderConnection);

    if (provider === 'openai') {
      const apiKey = providerConnection?.apiKey ?? process.env.OPENAI_API_KEY;
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
      const accessToken = this.getCodexAccessToken(providerConnection);
      const responsesUrl = providerConnection?.responsesUrl || process.env.OPENAI_CODEX_RESPONSES_URL || 'https://chatgpt.com/backend-api/codex/responses';

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
      const apiKey = providerConnection?.apiKey ?? process.env.ANTHROPIC_API_KEY;
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

    const apiKey = providerConnection?.apiKey ?? process.env.GEMINI_API_KEY;
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

  async analyzeJobPosting(
    content: string,
    aiModel: AiGenerationModel = DEFAULT_AI_MODEL,
    aiProviderConnection?: AiProviderConnection,
  ): Promise<JobPostingAnalysisResult> {
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
      const text = await this.generateText(prompt, aiModel, { json: true, aiProviderConnection });
      return this.parseJsonResponse(text || '{}', this.fallbackJobPostingAnalysis(content));
    } catch (e) {
      return this.fallbackJobPostingAnalysis(content);
    }
  }

  async generateResume(
    profile: ProfileForGeneration,
    jobPosting: JobPostingForGeneration,
    aiModel: AiGenerationModel = DEFAULT_AI_MODEL,
    aiProviderConnection?: AiProviderConnection,
  ): Promise<string> {
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
      return await this.generateText(prompt, aiModel, { aiProviderConnection }) || this.fallbackResume(profile, jobPosting);
    } catch (e) {
      return this.fallbackResume(profile, jobPosting);
    }
  }

  async generatePortfolio(
    profile: ProfileForGeneration,
    jobPosting: JobPostingForGeneration,
    aiModel: AiGenerationModel = DEFAULT_AI_MODEL,
    aiProviderConnection?: AiProviderConnection,
  ): Promise<string> {
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
      return await this.generateText(prompt, aiModel, { aiProviderConnection }) || this.fallbackPortfolio(profile, jobPosting);
    } catch (e) {
      return this.fallbackPortfolio(profile, jobPosting);
    }
  }

  async generateInterviewerResponse(
    messages: MessageForInterview[],
    difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED',
    aiModel: AiGenerationModel = DEFAULT_AI_MODEL,
    aiProviderConnection?: AiProviderConnection,
  ): Promise<string> {
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
      return await this.generateText(prompt, aiModel, { systemInstruction, aiProviderConnection }) || this.fallbackInterviewerResponse(messages, difficulty);
    } catch (e) {
      return this.fallbackInterviewerResponse(messages, difficulty);
    }
  }

  async generateInterviewFeedback(
    messages: MessageForInterview[],
    aiModel: AiGenerationModel = DEFAULT_AI_MODEL,
    aiProviderConnection?: AiProviderConnection,
  ): Promise<InterviewFeedbackResult> {
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
      const text = await this.generateText(prompt, aiModel, { json: true, aiProviderConnection });
      return this.parseJsonResponse(text || '{}', this.fallbackInterviewFeedback(messages));
    } catch (e) {
      return this.fallbackInterviewFeedback(messages);
    }
  }

  async generateExpectedQuestions(
    jobPosting: JobPostingForGeneration,
    aiModel: AiGenerationModel = DEFAULT_AI_MODEL,
    aiProviderConnection?: AiProviderConnection,
  ): Promise<ExpectedInterviewQuestion[]> {
    const prompt = `
다음 채용 공고를 바탕으로 예상 면접 질문 5개와 각 질문의 답변 가이드를 JSON 배열로 작성해 주세요.
각 항목은 question, guide 필드를 가져야 합니다.

[채용 공고]
회사: ${jobPosting.company || '미상'}
직무: ${jobPosting.title}
상세 내용:
${jobPosting.content}

응답 형식:
[
  { "question": "질문", "guide": "답변 가이드" }
]`;

    try {
      const text = await this.generateText(prompt, aiModel, { json: true, aiProviderConnection });
      const parsed = this.parseJsonResponse<ExpectedInterviewQuestion[] | { questions?: ExpectedInterviewQuestion[] }>(
        text || '[]',
        this.fallbackExpectedQuestions(jobPosting),
      );
      const questions = Array.isArray(parsed) ? parsed : parsed.questions ?? [];
      return questions.length > 0 ? questions.slice(0, 5) : this.fallbackExpectedQuestions(jobPosting);
    } catch {
      return this.fallbackExpectedQuestions(jobPosting);
    }
  }
}
