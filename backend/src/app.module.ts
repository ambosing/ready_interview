import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AiModule } from './ai/ai.module.js';

import { ApplicationModule } from './application/application.module.js';
import { CareerModule } from './career/career.module.js';
import { CertificationModule } from './certification/certification.module.js';
import { DocumentModule } from './document/document.module.js';
import { EducationModule } from './education/education.module.js';
import { InterviewModule } from './interview/interview.module.js';
import { JobPostingModule } from './job-posting/job-posting.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { ProjectModule } from './project/project.module.js';
import { SelfEvaluationModule } from './self-evaluation/self-evaluation.module.js';
import { SkillModule } from './skill/skill.module.js';
import { SwotModule } from './swot/swot.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AiModule,
    ApplicationModule,
    CareerModule,
    CertificationModule,
    DocumentModule,
    EducationModule,
    InterviewModule,
    JobPostingModule,
    ProfileModule,
    ProjectModule,
    SelfEvaluationModule,
    SkillModule,
    SwotModule,
  ],
})
export class AppModule {}
