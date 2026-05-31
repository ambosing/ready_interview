import 'dotenv/config';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

function resolveDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';

  if (!databaseUrl.startsWith('file:')) {
    throw new Error('DATABASE_URL must use a file: SQLite URL for this seed');
  }

  const dbUrl = databaseUrl.replace(/^file:/, '');
  const dbPath = path.isAbsolute(dbUrl) ? dbUrl : path.resolve(process.cwd(), dbUrl);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  return `file:${dbPath}`;
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: resolveDatabaseUrl() } as any),
});

async function main() {
  const password = await bcrypt.hash('Password123!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@hirey.local' },
    update: {},
    create: {
      email: 'demo@hirey.local',
      name: 'Demo User',
      password,
      profile: {
        create: {
          phone: '010-0000-0000',
          address: 'Seoul',
          bio: 'API 연동과 제품 경험 개선에 관심이 많은 지원자입니다.',
          educations: {
            create: {
              school: 'Hirey University',
              major: 'Computer Science',
              degree: 'BS',
              startDate: new Date('2018-03-01T00:00:00.000Z'),
              endDate: new Date('2022-02-01T00:00:00.000Z'),
            },
          },
          skills: {
            create: [
              { name: 'React', category: 'Frontend', proficiency: 'ADVANCED' },
              { name: 'TypeScript', category: 'Frontend', proficiency: 'ADVANCED' },
              { name: 'API Integration', category: 'Backend', proficiency: 'INTERMEDIATE' },
            ],
          },
          swotAnalysis: {
            create: {
              strengths: JSON.stringify(['빠른 실행력', '사용자 흐름 이해']),
              weaknesses: JSON.stringify(['수치 기반 설명 보강 필요']),
              opportunities: JSON.stringify(['AI 채용 도구 확산']),
              threats: JSON.stringify(['경쟁 서비스 증가']),
            },
          },
        },
      },
    },
    include: { profile: true },
  });

  await prisma.jobPosting.upsert({
    where: { id: 'demo-job-posting' },
    update: {},
    create: {
      id: 'demo-job-posting',
      userId: user.id,
      title: 'Frontend Engineer',
      company: 'Hirey Labs',
      url: 'https://example.com/jobs/frontend',
      content:
        'React, TypeScript, API 연동, 상태관리, 테스트 자동화 경험을 갖춘 프론트엔드 엔지니어를 찾습니다. 사용자는 제품 지표를 개선하고 사용자 경험을 세밀하게 다듬는 역할을 수행합니다. 협업과 문서화 역량을 중요하게 보며 백엔드 API와의 통합 경험을 우대합니다. 성능 최적화와 클라우드 배포 이해가 있으면 좋습니다.',
      status: 'ANALYZED',
      analyzedKeywords: JSON.stringify(['React', 'TypeScript', 'API 연동', '상태관리', '테스트', '사용자 경험']),
      analyzedRequirements: JSON.stringify([
        'React와 TypeScript 기반 UI 구현 경험',
        '백엔드 API 연동과 상태관리 경험',
        '테스트 자동화와 협업 문서화 역량',
      ]),
    },
  });

  console.log('Seed data created: demo@hirey.local / Password123!');
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
