# Recruitment Platform MVP - Implementation Plan

## Tech Stack
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + React Router v7 + TanStack Query + Zustand + Axios
- **Backend**: Express.js + TypeScript + Prisma + PostgreSQL + JWT (bcrypt + jsonwebtoken)
- **Structure**: Monorepo with `frontend/` and `backend/` directories

---

## Task 1: Project Scaffolding

### Goal
Set up monorepo structure with frontend (Vite + React) and backend (Express + TypeScript) projects, all configs, and shared types.

### Files to Create
```
ready_interview/
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html
│   ├── components.json          # shadcn/ui config
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── lib/
│       │   ├── api.ts           # Axios instance with interceptors
│       │   ├── utils.ts         # cn() helper for shadcn
│       │   └── query-client.ts  # TanStack Query client
│       ├── stores/
│       │   └── auth-store.ts    # Zustand auth store
│       ├── components/
│       │   └── ui/              # shadcn/ui components will go here
│       ├── pages/               # Page components
│       └── types/
│           └── index.ts         # Shared frontend types
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts             # Express server entry
│       ├── app.ts               # Express app setup (middleware, routes)
│       ├── config/
│       │   └── index.ts         # Environment config
│       ├── middleware/
│       │   ├── auth.ts          # JWT auth middleware
│       │   ├── error-handler.ts # Global error handler
│       │   └── validate.ts      # Request validation middleware
│       ├── routes/              # Route handlers
│       ├── services/            # Business logic
│       ├── lib/
│       │   └── prisma.ts        # Prisma client singleton
│       └── types/
│           └── index.ts         # Backend types
├── .gitignore
├── .env.example
└── package.json                 # Root package.json with workspace scripts
```

### Dependencies
**Frontend**: react, react-dom, react-router, @tanstack/react-query, zustand, axios, tailwindcss, postcss, autoprefixer, clsx, tailwind-merge, class-variance-authority, lucide-react
**Backend**: express, cors, helmet, bcryptjs, jsonwebtoken, zod, dotenv, @prisma/client
**DevDeps Frontend**: typescript, @types/react, @types/react-dom, vite, @vitejs/plugin-react
**DevDeps Backend**: typescript, tsx, @types/express, @types/cors, @types/bcryptjs, @types/jsonwebtoken, prisma, nodemon

### Acceptance Criteria
- `cd frontend && npm run dev` starts Vite dev server without errors
- `cd backend && npm run dev` starts Express server on port 3001
- Frontend shows a test page at http://localhost:5173
- Backend responds to GET /api/health with `{ status: "ok" }`
- Tailwind CSS classes work in frontend
- TypeScript compilation passes in both projects

---

## Task 2: Database Schema + Prisma Setup

### Goal
Define complete Prisma schema with all MVP tables and run initial migration.

### Files to Create/Modify
```
backend/
├── prisma/
│   └── schema.prisma
│   └── seed.ts              # Seed data for development
└── src/
    └── lib/
        └── prisma.ts         # Prisma client singleton
```

### Schema Tables
1. **User** - id, email, password, name, createdAt, updatedAt
2. **Profile** - id, userId(1:1), phone, address, bio, profileImageUrl, completeness(Int)
3. **Education** - id, profileId, school, major, degree, startDate, endDate, description
4. **Career** - id, profileId, company, position, department, startDate, endDate, isCurrent, description
5. **Certification** - id, profileId, name, issuer, issueDate, expiryDate, credentialId
6. **Project** - id, profileId, name, description, role, techStack, startDate, endDate, achievements, url
7. **Skill** - id, profileId, name, category, proficiency(enum: BEGINNER/INTERMEDIATE/ADVANCED/EXPERT)
8. **SwotAnalysis** - id, profileId, strengths, weaknesses, opportunities, threats (all Text[])
9. **JobPosting** - id, userId, title, company, url, content(text), status(enum), analyzedKeywords(Json), createdAt
10. **GeneratedDocument** - id, jobPostingId, userId, type(enum: RESUME/PORTFOLIO), content(text), createdAt
11. **DocumentVersion** - id, documentId, content(text), versionNumber(Int), createdAt
12. **Application** - id, userId, jobPostingId, status(enum: APPLIED/SCREENING/INTERVIEW/OFFER/REJECTED/WITHDRAWN), appliedAt, notes
13. **InterviewSession** - id, applicationId, userId, type(enum: TEXT/VOICE), difficulty(enum), status(enum), startedAt, endedAt, feedback(Json)
14. **InterviewMessage** - id, sessionId, role(enum: INTERVIEWER/USER), content, createdAt
15. **SelfEvaluation** - id, applicationId, userId, performance, strengths, improvements, questionsAsked, notes, createdAt

### Acceptance Criteria
- `npx prisma migrate dev` runs successfully
- `npx prisma studio` shows all tables
- Seed script populates test data
- Prisma client generates without errors

---

## Task 3: Backend Auth System

### Goal
Implement JWT-based authentication with signup, login, token refresh, and auth middleware.

### Files to Create/Modify
```
backend/src/
├── routes/
│   └── auth.ts              # POST /signup, POST /login, POST /refresh, GET /me
├── services/
│   └── auth.service.ts      # Auth business logic
├── middleware/
│   └── auth.ts              # JWT verification middleware
└── types/
    └── index.ts             # AuthRequest type extension
```

### API Endpoints
- POST /api/auth/signup - { email, password, name } → { user, token, refreshToken }
- POST /api/auth/login - { email, password } → { user, token, refreshToken }
- POST /api/auth/refresh - { refreshToken } → { token, refreshToken }
- GET /api/auth/me - (auth required) → { user }

### Acceptance Criteria
- Signup creates user with hashed password
- Login returns JWT token (1h expiry) and refresh token (7d expiry)
- Protected routes return 401 without token
- Duplicate email signup returns 409
- Invalid credentials return 401
- Password validation: min 8 chars

---

## Task 4: Backend API Routes

### Goal
Implement all CRUD API routes for profile, job postings, documents, interviews, applications.

### Files to Create/Modify
```
backend/src/
├── routes/
│   ├── profile.ts           # Profile CRUD
│   ├── education.ts         # Education CRUD
│   ├── career.ts            # Career CRUD
│   ├── certification.ts     # Certification CRUD
│   ├── project.ts           # Project CRUD
│   ├── skill.ts             # Skill CRUD
│   ├── swot.ts              # SWOT CRUD
│   ├── job-posting.ts       # Job posting CRUD + analysis
│   ├── document.ts          # Document generation + CRUD
│   ├── application.ts       # Application CRUD + status
│   ├── interview.ts         # Interview session + messages
│   └── self-evaluation.ts   # Self-evaluation CRUD
├── services/
│   ├── profile.service.ts
│   ├── job-posting.service.ts
│   ├── document.service.ts
│   ├── mock-ai.service.ts   # Mock AI responses
│   ├── application.service.ts
│   └── interview.service.ts
└── app.ts                   # Register all routes
```

### Mock AI Service Endpoints
- POST /api/job-postings/:id/analyze → Returns mock analysis (keywords, requirements)
- POST /api/documents/generate-resume → Returns mock Korean resume text
- POST /api/documents/generate-portfolio → Returns mock Korean portfolio text
- POST /api/interviews/:id/messages → Returns mock interviewer response
- POST /api/interviews/:id/feedback → Returns mock feedback with scores

### Key API Patterns
- All routes use auth middleware
- Zod validation on all request bodies
- Consistent error response format: { error: string, details?: any }
- Consistent success format: { data: T } or { data: T[], total: number }
- Pagination: ?page=1&limit=20

### Acceptance Criteria
- All CRUD operations work for all entities
- Auth middleware protects all routes
- Users can only access their own data
- Mock AI returns realistic Korean text
- Validation errors return 400 with details
- Not found returns 404

---

## Task 5: Frontend Auth Pages

### Goal
Implement login and signup pages with form validation and auth flow.

### Files to Create/Modify
```
frontend/src/
├── pages/
│   ├── LoginPage.tsx
│   └── SignupPage.tsx
├── stores/
│   └── auth-store.ts         # Token management, user state
├── lib/
│   └── api.ts                # Add auth interceptors
├── components/
│   ├── ui/
│   │   ├── button.tsx         # shadcn
│   │   ├── input.tsx          # shadcn
│   │   ├── label.tsx          # shadcn
│   │   ├── card.tsx           # shadcn
│   │   └── toast.tsx          # shadcn (or sonner)
│   └── auth/
│       ├── LoginForm.tsx
│       └── SignupForm.tsx
└── App.tsx                    # Add routing with auth guards
```

### Features
- Login form: email + password
- Signup form: name + email + password + password confirmation
- Client-side validation
- Error display (toast or inline)
- Auto-redirect after login/signup
- Token storage in localStorage
- Axios interceptor adds Authorization header
- Protected route wrapper component

### Acceptance Criteria
- User can sign up and is redirected to dashboard
- User can log in and is redirected to dashboard
- Invalid credentials show error message
- Unauthenticated users are redirected to login
- Token persists across page refresh

---

## Task 6: Frontend Layout + Routing + Dashboard

### Goal
Create the main authenticated layout with sidebar navigation and dashboard page.

### Files to Create/Modify
```
frontend/src/
├── App.tsx                    # Full route configuration
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx     # Sidebar + main content area
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   ├── Header.tsx         # Top header with user info
│   │   └── ProtectedRoute.tsx # Auth guard wrapper
│   └── dashboard/
│       ├── StatusSummary.tsx   # Application status cards
│       ├── RecentDocuments.tsx # Recent generated docs list
│       └── QuickActions.tsx    # Quick action buttons
├── pages/
│   └── DashboardPage.tsx
└── types/
    └── index.ts               # Dashboard types
```

### Sidebar Navigation Items (Korean)
1. 대시보드 (Dashboard)
2. 프로필 관리 (Profile)
3. 채용 공고 (Job Postings)
4. 서류 생성 (Documents)
5. 면접 준비 (Interview)
6. 지원 관리 (Applications)
7. 설정 (Settings)

### Dashboard Content
- Status summary: 4 cards (지원중, 서류합격, 면접예정, 최종합격)
- Recent documents: List of 5 most recent generated docs
- Quick actions: 새 프로필 작성, 채용 공고 등록, 서류 생성

### Acceptance Criteria
- Sidebar navigation works for all routes
- Dashboard loads with summary cards (data from API or zeros for new users)
- Responsive: sidebar collapses on mobile
- Active route highlighted in sidebar
- User name displayed in header
- Logout button works

---

## Task 7: Frontend Profile Management Pages

### Goal
Implement complete profile management with tabs for each section.

### Files to Create/Modify
```
frontend/src/
├── pages/
│   └── ProfilePage.tsx        # Tab-based profile page
├── components/
│   ├── profile/
│   │   ├── ProfileTabs.tsx    # Tab navigation
│   │   ├── EducationSection.tsx
│   │   ├── CareerSection.tsx
│   │   ├── CertificationSection.tsx
│   │   ├── ProjectSection.tsx
│   │   ├── SkillSection.tsx
│   │   ├── SwotSection.tsx
│   │   ├── ProfileCompleteness.tsx  # Progress indicator
│   │   └── forms/
│   │       ├── EducationForm.tsx
│   │       ├── CareerForm.tsx
│   │       ├── CertificationForm.tsx
│   │       ├── ProjectForm.tsx
│   │       └── SkillForm.tsx
│   └── ui/
│       ├── tabs.tsx           # shadcn
│       ├── dialog.tsx         # shadcn (for forms)
│       ├── select.tsx         # shadcn
│       ├── textarea.tsx       # shadcn
│       └── badge.tsx          # shadcn
└── hooks/
    ├── use-profile.ts         # TanStack Query hooks for profile
    ├── use-education.ts
    ├── use-career.ts
    ├── use-certification.ts
    ├── use-project.ts
    ├── use-skill.ts
    └── use-swot.ts
```

### Profile Sections (Tabs)
1. 기본 정보 - Basic info (name, phone, address, bio)
2. 학력 - Education (CRUD list with dialog form)
3. 경력 - Career (CRUD list with dialog form)
4. 자격증 - Certifications (CRUD list with dialog form)
5. 프로젝트 - Projects (CRUD list with dialog form)
6. 핵심 역량 - Skills (tag-like input with proficiency levels)
7. SWOT 분석 - SWOT (4-quadrant input)

### Profile Completeness
- Calculate based on: basic info (20%), education (15%), career (20%), certifications (10%), projects (20%), skills (10%), SWOT (5%)
- Display as progress bar with percentage

### Acceptance Criteria
- All 7 tabs functional with CRUD operations
- Forms validate required fields
- Add/Edit/Delete operations with confirmation
- Profile completeness updates dynamically
- Empty states with helpful messages
- Loading states during API calls

---

## Task 8: Frontend Job Posting + Document Generation Pages

### Goal
Implement job posting input, analysis display, and document generation with editor.

### Files to Create/Modify
```
frontend/src/
├── pages/
│   ├── JobPostingsPage.tsx    # List of saved job postings
│   ├── JobPostingNewPage.tsx  # Create new job posting (paste text)
│   ├── JobPostingDetailPage.tsx # View analysis + generate docs
│   └── DocumentEditorPage.tsx # View/edit generated document
├── components/
│   ├── job-posting/
│   │   ├── JobPostingForm.tsx     # URL + text paste form
│   │   ├── TextValidator.tsx      # Validation feedback
│   │   ├── AnalysisResult.tsx     # Display extracted keywords/requirements
│   │   └── JobPostingCard.tsx     # Card for listing
│   ├── document/
│   │   ├── DocumentGenerator.tsx  # Generation trigger + loading
│   │   ├── DocumentEditor.tsx     # Textarea-based editor
│   │   ├── DocumentPreview.tsx    # Preview of generated doc
│   │   ├── VersionHistory.tsx     # List of versions
│   │   └── DocumentCard.tsx       # Card for listing
│   └── ui/
│       └── (additional shadcn components as needed)
└── hooks/
    ├── use-job-postings.ts
    └── use-documents.ts
```

### Job Posting Flow
1. User enters URL (optional) + pastes job posting text
2. Text validation: min 200 chars, check for key sections
3. Save → triggers mock analysis → shows extracted info
4. User clicks "이력서 생성" or "포트폴리오 생성"
5. Mock AI generates document → shows in editor
6. User can edit in textarea → save as new version

### Acceptance Criteria
- Job posting form validates text length
- Analysis result displays mock keywords and requirements
- Resume generation produces mock Korean resume text
- Portfolio generation produces mock Korean portfolio text
- Document editor allows editing and saving
- Version history shows saved versions
- Can navigate between versions

---

## Task 9: Frontend Interview Prep Pages

### Goal
Implement interview preparation with mock questions, chat-based interview, and self-evaluation.

### Files to Create/Modify
```
frontend/src/
├── pages/
│   ├── InterviewPrepPage.tsx      # Overview of interview features
│   ├── InterviewQuestionsPage.tsx # View expected questions
│   ├── MockInterviewPage.tsx      # Chat-based mock interview
│   ├── InterviewFeedbackPage.tsx  # View feedback results
│   └── SelfEvaluationPage.tsx     # Record self-evaluation
├── components/
│   ├── interview/
│   │   ├── QuestionList.tsx       # List of expected questions with guide
│   │   ├── ChatInterface.tsx      # Chat UI for mock interview
│   │   ├── ChatMessage.tsx        # Individual chat message bubble
│   │   ├── FeedbackDisplay.tsx    # Feedback scores and details
│   │   ├── ScoreCard.tsx          # Score visualization
│   │   ├── EvaluationForm.tsx     # Self-evaluation form
│   │   └── EvaluationHistory.tsx  # Past evaluations list
│   └── ui/
│       └── (additional shadcn components as needed)
└── hooks/
    ├── use-interview.ts
    └── use-self-evaluation.ts
```

### Interview Flow
1. Select an application → view expected questions (mock generated)
2. Each question has a guide/tip for answering
3. Start mock interview → chat interface
4. User types answers → mock AI responds with follow-ups
5. End interview → view feedback (mock scores: 0-100)
6. Record self-evaluation after real interviews

### Acceptance Criteria
- Expected questions display with answer guides
- Chat interface works with mock responses
- Mock interview can be started and ended
- Feedback displays with scores and improvement tips
- Self-evaluation form saves and shows history
- Chat messages display correctly (user vs AI styling)

---

## Task 10: Frontend Application Management + Settings Pages

### Goal
Implement application tracking and settings pages.

### Files to Create/Modify
```
frontend/src/
├── pages/
│   ├── ApplicationsPage.tsx    # List all applications
│   ├── ApplicationDetailPage.tsx # Detail with status + docs
│   └── SettingsPage.tsx        # Account + notification settings
├── components/
│   ├── application/
│   │   ├── ApplicationList.tsx     # Kanban or list view
│   │   ├── ApplicationCard.tsx     # Card with status badge
│   │   ├── StatusBadge.tsx         # Colored status badge
│   │   ├── StatusChanger.tsx       # Dropdown to change status
│   │   └── LinkedDocuments.tsx     # Show generated docs for this application
│   ├── settings/
│   │   ├── AccountSettings.tsx     # Email, password change
│   │   ├── NotificationSettings.tsx # Toggle preferences (UI only)
│   │   └── DangerZone.tsx          # Account deletion (UI only)
│   └── ui/
│       └── (additional shadcn components as needed)
└── hooks/
    ├── use-applications.ts
    └── use-settings.ts
```

### Application Management Features
- List all applications with status badges
- Filter by status
- Change application status
- View linked documents and interview sessions
- Notes field per application

### Settings Features
- Change display name
- Change password (current password required)
- Notification toggles (UI state only, no backend notifications)
- Logout
- Account deletion button (UI only, shows confirmation)

### Acceptance Criteria
- Application list displays with correct status badges
- Status can be changed via dropdown
- Linked documents are clickable and navigate to editor
- Settings page saves name/password changes
- Notification toggles work in UI
- Logout clears auth state and redirects
