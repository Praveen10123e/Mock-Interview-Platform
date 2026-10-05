# Database Usage & Architectural Audit

This document provides a comprehensive, forensic audit of the entire codebase to determine the exact usage, data ownership, dependencies, and runtime roles of **PostgreSQL**, **MongoDB**, and **Redis**.

---

## 1. Executive Summary

| Database / Service | Container in Docker | Installed in `package.json` | Imported / Used in Code | Runtime Connection | Current Architectural Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **PostgreSQL** | **YES** (`nm_postgres:5432`) | **YES** (`@prisma/client`, `prisma`) | **YES** (Authoritative across all 5 core backend services) | **ACTIVE & CONNECTED** | **ACTIVE — Primary Authoritative Database** |
| **MongoDB** | **YES** (`nm_mongodb:27017`) | **NO** (0 dependencies) | **NO** (0 models, 0 collections, 0 queries) | **UNUSED BY APP** | **CONFIGURED ONLY — Completely Unused** |
| **Redis** | **YES** (`nm_redis:6379`) | **NO** (0 dependencies) | **NO** (0 cache keys, 0 queues, 0 pub/sub) | **UNUSED BY APP** | **CONFIGURED ONLY — Completely Unused** |

---

## 2. PostgreSQL Audit

PostgreSQL is the **single authoritative database** for the entire technical mock interview platform. All relational entities, authentication credentials, candidate profiles, question bank datasets, interview execution records, AI evaluation snapshots, autopsy failure patterns, DNA skill progressions, and personalized improvement plans are persisted exclusively in PostgreSQL using **Prisma ORM**.

### PostgreSQL Usage Table

| Service | Key Source Files | Technology / ORM | Models & Tables Accessed | CRUD Operations | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth Service** | [`schema.prisma`](file:///d:/MINI_PROJECT/apps/backend/services/auth-service/prisma/schema.prisma)<br>[`IdentityRepository.ts`](file:///d:/MINI_PROJECT/apps/backend/services/auth-service/src/repositories/IdentityRepository.ts)<br>[`SessionRepository.ts`](file:///d:/MINI_PROJECT/apps/backend/services/auth-service/src/repositories/SessionRepository.ts)<br>[`RefreshTokenRepository.ts`](file:///d:/MINI_PROJECT/apps/backend/services/auth-service/src/repositories/RefreshTokenRepository.ts)<br>[`RoleRepository.ts`](file:///d:/MINI_PROJECT/apps/backend/services/auth-service/src/repositories/RoleRepository.ts) | Prisma ORM (`@prisma/client`) | `Identity`, `Role`, `Permission`, `IdentityRole`, `RolePermission`, `Session`, `RefreshToken`, `VerificationToken`, `PasswordResetToken`, `AuditLog` | Create, Read, Update, Delete | User authentication, password hashes, RBAC permission resolution, session tokens, refresh token rotation, password reset OTPs, and security audit logs. |
| **User Service** | [`schema.prisma`](file:///d:/MINI_PROJECT/apps/backend/services/user-service/prisma/schema.prisma)<br>[`ProfileRepository.ts`](file:///d:/MINI_PROJECT/apps/backend/services/user-service/src/repositories/ProfileRepository.ts)<br>[`EducationRepository.ts`](file:///d:/MINI_PROJECT/apps/backend/services/user-service/src/repositories/EducationRepository.ts)<br>[`SkillRepository.ts`](file:///d:/MINI_PROJECT/apps/backend/services/user-service/src/repositories/SkillRepository.ts)<br>[`ResumeRepository.ts`](file:///d:/MINI_PROJECT/apps/backend/services/user-service/src/repositories/ResumeRepository.ts)<br>[`AdminUserService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/user-service/src/services/AdminUserService.ts) | Prisma ORM (`@prisma/client`) | `Profile`, `StudentProfile`, `FacultyProfile`, `AdminProfile`, `CareerProfile`, `AIPreferences`, `InterviewPreference`, `NMProfile`, `SocialLinks`, `ProfileMetrics`, `Education`, `ProfileSkill`, `Skill`, `Resume` | Create, Read, Update, Delete | Candidate educational history, Naan Mudhalvan registration metadata, faculty records, career goals, AI interview parameters (strictness, hint mode), profile completion scores, and uploaded resume text. |
| **Question Bank Service** | [`schema.prisma`](file:///d:/MINI_PROJECT/apps/backend/services/question-bank-service/prisma/schema.prisma)<br>[`SearchService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/question-bank-service/src/services/SearchService.ts)<br>[`QuestionManagementService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/question-bank-service/src/services/QuestionManagementService.ts)<br>[`ImportService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/question-bank-service/src/services/ImportService.ts)<br>[`DatasetService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/question-bank-service/src/services/DatasetService.ts) | Prisma ORM (`@prisma/client`) | `Question`, `QuestionCategory`, `QuestionTopic`, `QuestionSubTopic`, `ProgrammingLanguage`, `Company`, `QuestionTag`, `QuestionMetadata`, `QuestionExample`, `TestCase`, `QuestionExplanation`, `QuestionHint` | Create, Read, Update, Delete, Aggregate (`_count`) | Curated question bank catalog (40 Coding, 15 Aptitude, 10 HR), categorized topics, visible test case definitions, multi-language starter code templates, difficulty ratings, and tagging. |
| **Interview Service** | [`schema.prisma`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/prisma/schema.prisma)<br>[`InterviewService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/src/services/InterviewService.ts)<br>[`InterviewSessionService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/src/services/InterviewSessionService.ts)<br>[`InterviewStageService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/src/services/InterviewStageService.ts)<br>[`InterviewAIService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/src/services/InterviewAIService.ts)<br>[`ReportService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/src/services/ReportService.ts)<br>[`InterviewAutopsyService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/src/services/InterviewAutopsyService.ts)<br>[`InterviewDNAService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/src/services/InterviewDNAService.ts)<br>[`PersonalizedImprovementEngine.ts`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/src/services/PersonalizedImprovementEngine.ts)<br>[`FacultyInterviewService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/src/services/FacultyInterviewService.ts)<br>[`AdminService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/src/services/AdminService.ts) | Prisma ORM (`@prisma/client`) | `Interview`, `InterviewTemplate`, `TemplateQuestionReference`, `InterviewConfiguration`, `InterviewSession`, `InterviewStage`, `StageQuestion`, `StageCodingExecution`, `StageHrResponse`, `StageAptitudeAnswer`, `InterviewSnapshot`, `InterviewEvent`, `InterviewTimeline`, `InterviewHistory`, `InterviewMetadata`, `InterviewCandidateContext` | Create, Read, Update, Delete, Transactional writes, JSON payload queries | Complete lifecycle of mock interviews: multi-round scheduling (Aptitude, Coding, HR), real-time STT transcripts, verified AI corrections, execution submissions, automated rubrics, longitudinal skill evolution (DNA), failure root cause diagnostics (Autopsy), and closed-loop improvement plans. |
| **Judge Service** | [`schema.prisma`](file:///d:/MINI_PROJECT/apps/backend/services/judge-service/prisma/schema.prisma) | Prisma ORM (`@prisma/client`) | `ExecutionHistory`, `LanguageMapping` | Schema defined | Provisioned for long-term audit logs of code executions and language mapping configurations. |

### PostgreSQL Data Responsibility

Based on the source code, PostgreSQL is responsible for **100% of persisted application data**, including:
1. **Core Relational Structures**: Foreign keys, cascades, composite indices, unique constraints across candidates, interviews, and questions.
2. **ACID Transactions**: Atomic finalization of multi-round interview scoring and stage state machines.
3. **Structured JSON Storage (`@db.Json` / `Json?`)**: Complex AI analysis summaries, STT transcripts, canonical skill score records, test case inputs/outputs, and comprehensive diagnostic report snapshots.

---

## 3. MongoDB Audit

### Evidence Scan Results

A full project-wide scan for `mongodb`, `mongoose`, `MongoClient`, `MONGO_URI`, and `mongoose.connect` was conducted:

1. **Dependency Analysis**:
   - `package.json` in root: **No MongoDB dependencies.**
   - `package.json` across all 5 backend services: **No `mongodb` or `mongoose` packages installed.**
   - `apps/frontend/package.json`: **No MongoDB packages.**
2. **Code Search**:
   - `grep` for `mongoose.connect` or `new MongoClient`: **0 occurrences.**
   - `grep` for Mongo schemas or collections: **0 occurrences.**
   - The only references to "mongo" in code files are:
     - `packages/config/src/schema.ts` (Line 8: `MONGO_URI: z.string().url().optional()`)
     - String literals / regex patterns in HR transcript sanitizers (e.g., [`HRTranscriptValidator.ts`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/src/services/HRTranscriptValidator.ts#L156-L163) matching when a student mentions the word *"MongoDB"* in an interview answer).
3. **Configuration & Docker**:
   - `docker-compose.yml` (Lines 19–30) starts container `nm_mongodb` (`mongo:6-jammy`).
   - `.env` and `.env.example` define `MONGO_URI=mongodb://mongo:mongo@localhost:27017/nm_interview_docs?authSource=admin`.

### MongoDB Usage Table

| Service | File | Technology | Collection / Model | Operation | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *None* | *None* | *None* | *None* | *None* | **No service in the codebase connects to or interacts with MongoDB.** |

### Is MongoDB Actually Used?

> ### **NO — only Docker / configuration exists.**
> 
> While `nm_mongodb` runs as a Docker container, **no application code connects to, writes to, or reads from MongoDB**. The comment in `docker-compose.yml` suggesting MongoDB is for *"Resumes, Transcripts, Behavioral Analytics JSON"* is superseded by PostgreSQL, which natively stores all resumes ([`Resume`](file:///d:/MINI_PROJECT/apps/backend/services/user-service/prisma/schema.prisma#L34)), transcripts ([`StageHrResponse`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/prisma/schema.prisma#L250)), and analytics (`reportSnapshot Json?`) via PostgreSQL's JSON/Text data types.

---

## 4. Redis Audit

### Evidence Scan Results

A full project-wide scan for `redis`, `ioredis`, `createClient`, `REDIS_URL`, `Bull`, and `BullMQ` was conducted:

1. **Dependency Analysis**:
   - `package.json` across all backend services: **0 Redis, ioredis, Bull, or BullMQ dependencies installed.**
2. **Source Code Implementation**:
   - [`AdminService.ts`](file:///d:/MINI_PROJECT/apps/backend/services/interview-service/src/services/AdminService.ts#L528-L532) and [`AdminSystem.tsx`](file:///d:/MINI_PROJECT/apps/frontend/src/pages/admin/AdminSystem.tsx#L31-L34) explicitly document the Redis status:
     ```typescript
     redis: {
       status: 'DISABLED',
       isUsed: false,
       reason: 'Stateless JWT Architecture (No caching layer or Redis broker required)',
     }
     ```
   - [`docs/user/User_Service_Architecture.md`](file:///d:/MINI_PROJECT/docs/user/User_Service_Architecture.md#L18): *"While redis logic is explicitly omitted currently, the architectural seam exists for instantaneous cache dropping when read loads scale."*
   - [`ExecutionQueue.ts`](file:///d:/MINI_PROJECT/apps/backend/services/judge-service/src/services/execution/ExecutionQueue.ts#L1-L33) uses an **in-memory counting semaphore** (`private static userExecutions = new Map<string, number>()`), not a distributed Redis queue.
   - Real-time interview communications use direct in-memory WebSocket/HTTP polling.
3. **Configuration & Docker**:
   - `docker-compose.yml` (Lines 32–40) provisions container `nm_redis` (`redis:7-alpine`).
   - `.env` and `.env.example` define `REDIS_HOST=localhost` and `REDIS_PORT=6379`.

### Redis Usage Table

| Service | File | Technology | Usage Type | Key / Queue | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *None* | *None* | *None* | *None* | *None* | **No service in the codebase connects to or interacts with Redis.** |

### Is Redis Actually Used?

> ### **NO — only Docker / configuration exists.**
> 
> The application operates entirely on a **stateless JWT architecture** with direct database interactions and in-memory execution throttling. Redis is not imported, connected to, or utilized by any backend service.

---

## 5. Docker Compose vs. Application Usage

| Container Name | Image | Port Mapping | Volume | Health / Status | Actually Used by Application Code? |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **`nm_postgres`** | `postgres:15-alpine` | `5432:5432` | `pg_data:/var/lib/postgresql/data` | Running (`accepting connections`) | **YES** (All 5 microservices connect via Prisma) |
| **`nm_mongodb`** | `mongo:6-jammy` | `27017:27017` | `mongo_data:/data/db` | Running (`{ ok: 1 }`) | **NO** (0 application connections) |
| **`nm_redis`** | `redis:7-alpine` | `6379:6379` | `redis_data:/data` | Running (`PONG`) | **NO** (0 application connections) |

---

## 6. Environment Variable Audit

| Variable Name | Defined In | Used in Application Code? | Referencing Service | Actual Purpose / Notes |
| :--- | :--- | :---: | :--- | :--- |
| `DATABASE_URL` | `.env`, `.env.example`, service `.env` files | **YES** | `auth-service`, `user-service`, `question-bank-service`, `interview-service`, `judge-service` | Connection string for PostgreSQL database used by Prisma Clients. |
| `POSTGRES_USER` | `.env`, `docker-compose.yml` | **YES (Docker)** | Docker daemon / `nm_postgres` | Initial superuser username for PostgreSQL container. |
| `POSTGRES_PASSWORD` | `.env`, `docker-compose.yml` | **YES (Docker)** | Docker daemon / `nm_postgres` | Initial superuser password for PostgreSQL container. |
| `POSTGRES_DB` | `.env`, `docker-compose.yml` | **YES (Docker)** | Docker daemon / `nm_postgres` | Default database name (`nm_interview_db`) created at container startup. |
| `MONGO_INITDB_ROOT_USERNAME` | `.env`, `docker-compose.yml` | **NO (App)** | Docker daemon / `nm_mongodb` | Unused root username for MongoDB container. |
| `MONGO_INITDB_ROOT_PASSWORD` | `.env`, `docker-compose.yml` | **NO (App)** | Docker daemon / `nm_mongodb` | Unused root password for MongoDB container. |
| `MONGO_URI` | `.env`, `.env.example`, `packages/config` | **NO (App)** | *None* | Configured in `.env` and Zod schema, but never passed to any database client. |
| `REDIS_HOST` | `.env`, `.env.example` | **NO (App)** | *None* | Configured in `.env`, but never referenced in any backend service. |
| `REDIS_PORT` | `.env`, `.env.example` | **NO (App)** | *None* | Configured in `.env`, but never referenced in any backend service. |
| `REDIS_URL` | `packages/config/src/schema.ts` | **NO (App)** | *None* | Defined in Zod schema, but never referenced in any service code. |

---

## 7. Package Dependency Audit

| Service / Directory | Package | Installed? | Imported in Code? | Actively Used? | Category |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `auth-service` | `@prisma/client`, `prisma` | **YES** | **YES** | **YES** | PostgreSQL ORM |
| `user-service` | `@prisma/client`, `prisma` | **YES** | **YES** | **YES** | PostgreSQL ORM |
| `question-bank-service` | `@prisma/client`, `prisma` | **YES** | **YES** | **YES** | PostgreSQL ORM |
| `interview-service` | `@prisma/client`, `prisma` | **YES** | **YES** | **YES** | PostgreSQL ORM |
| `judge-service` | `@prisma/client`, `prisma` | **YES** | Schema only | Standby | PostgreSQL ORM |
| *All Services* | `mongodb`, `mongoose` | **NO** | **NO** | **NO** | MongoDB Driver |
| *All Services* | `redis`, `ioredis`, `bull`, `bullmq` | **NO** | **NO** | **NO** | Redis Driver / Queue |

---

## 8. Service-by-Service Database Map

| Service Name | PostgreSQL | MongoDB | Redis | Code Evidence |
| :--- | :---: | :---: | :---: | :--- |
| **API Gateway** (`apps/backend/gateway`) | NO | NO | NO | Reverse proxy routing via `http-proxy-middleware`; stateless. |
| **Auth Service** (`apps/backend/services/auth-service`) | **YES** | NO | NO | Prisma client connects to PostgreSQL `nm_interview_db` for `Identity`, `Role`, `Session`, `RefreshToken`. |
| **User Service** (`apps/backend/services/user-service`) | **YES** | NO | NO | Prisma client connects to PostgreSQL `nm_interview_db` for `Profile`, `StudentProfile`, `Education`, `Resume`. |
| **Question Bank Service** (`apps/backend/services/question-bank-service`) | **YES** | NO | NO | Prisma client connects to PostgreSQL `nm_interview_db` for `Question`, `QuestionCategory`, `TestCase`. |
| **Interview Service** (`apps/backend/services/interview-service`) | **YES** | NO | NO | Prisma client connects to PostgreSQL `nm_interview_db` for `Interview`, `InterviewSession`, `InterviewStage`, `ReportSnapshot`. |
| **Judge Service** (`apps/backend/services/judge-service`) | **STANDBY** | NO | NO | Schema defined for `ExecutionHistory`; in-memory `ExecutionQueue` semaphore; Judge0 client. |
| **Frontend Application** (`apps/frontend`) | NO | NO | NO | Client-side React application connecting exclusively via HTTP REST APIs. |

---

## 9. Database Responsibility & Data Ownership Map

```
PostgreSQL (nm_interview_db) — [AUTHORITATIVE FOR ALL APPLICATION DATA]
├── Identity & Authentication
│   ├── User Accounts & Password Hashes (Identity)
│   ├── RBAC Roles & Permissions (Role, Permission, IdentityRole)
│   ├── Active Sessions & Opaque Tokens (Session)
│   ├── Refresh Tokens (RefreshToken)
│   └── Password Reset Tokens & Audit Logs
├── Profiles & Academics
│   ├── Student, Faculty, and Admin Profiles (Profile, StudentProfile, etc.)
│   ├── Educational History & Coursework (Education)
│   ├── Verified Skills & Competencies (ProfileSkill, Skill)
│   ├── AI Interview Preferences (AIPreferences)
│   └── Candidate Resumes & Raw Text (Resume)
├── Question Bank Curriculum
│   ├── Curated Problems: Coding, Aptitude, HR (Question)
│   ├── Hierarchy: Categories, Topics, Subtopics (QuestionCategory, QuestionTopic)
│   ├── Executable Test Cases: Visible & Edge Cases (TestCase)
│   └── Multi-Language Starter Code (ProgrammingLanguage)
└── Multi-Round Interview Engine
    ├── Session Lifecycle & State Machines (Interview, InterviewSession)
    ├── Per-Round Execution Data:
    │   ├── Aptitude Answer Submissions (StageAptitudeAnswer)
    │   ├── Coding Submissions & Test Case Results (StageCodingExecution)
    │   └── HR Transcripts & Speech-to-Text Logs (StageHrResponse)
    ├── Longitudinal Intelligence (Phase 5 / 6 / 7):
    │   ├── Autopsy Failure Patterns & Evidence (Stage Analysis JSON)
    │   ├── DNA Longitudinal Skill Genome & Evolution (InterviewSnapshot)
    │   └── Personalized Improvement Priorities & Tasks (ImprovementPlan JSON)
    └── Comprehensive Synthesized Diagnostic Reports (reportSnapshot)

MongoDB (nm_mongodb) — [UNUSED]
└── (No data stored or processed by any service)

Redis (nm_redis) — [UNUSED]
└── (No data stored, cached, or queued by any service)
```

---

## 10. Connection Flow Architecture

### Confirmed Application Connection Flow (PostgreSQL)

```
[ Frontend Client (React) ]
             │ HTTP REST
             ▼
[ API Gateway (Port 4000) ]
             │ Internal Route Proxy
   ┌─────────┼───────────────────────┬─────────────────────────┐
   ▼         ▼                       ▼                         ▼
[ Auth ]  [ User ]          [ Question Bank ]         [ Interview ]
 (4001)    (4002)                (4004)                    (4003)
   │         │                       │                         │
   └─────────┴───────────┬───────────┴─────────────────────────┘
                         │ Prisma Client (TCP Pool)
                         ▼
             [ PostgreSQL: 5432 ]
            (Database: nm_interview_db)
```

### In-Memory Concurrency Flow (Judge Service)

```
[ Frontend / Interview Service ]
               │ POST /execute
               ▼
   [ Judge Service (Port 3006) ]
               │
      [ ExecutionQueue.ts ]
    (In-Memory Map Semaphore)
        ├── Acquired  ──► [ Judge0 CE Engine ] ──► Return Results
        └── Exceeded  ──► HTTP 429 Rate Limit
```

---

## 11. Unused / Redundant Infrastructure

1. **MongoDB Docker Service (`nm_mongodb`)**:
   - Running in Docker on port `27017`, consuming memory and disk resources.
   - Zero application services install MongoDB drivers or connect to it.
   - All document/JSON data is natively handled by PostgreSQL `Json` / `Text` types.
2. **Redis Docker Service (`nm_redis`)**:
   - Running in Docker on port `6379`.
   - Zero application services install Redis clients (`ioredis`, `redis`).
   - Caching is not implemented, execution rate limiting is in-memory, and JWT tokens are stateless.
3. **Redundant Environment Variables**:
   - `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`, `MONGO_URI`
   - `REDIS_HOST`, `REDIS_PORT`, `REDIS_URL`

---

## 12. Final Database Usage Verdict

| Database | Docker Exists | Code Usage | Runtime Evidence | Actual Purpose in Platform | Status |
| :--- | :---: | :---: | :---: | :--- | :---: |
| **PostgreSQL** | **YES** | **YES** | Active TCP connections from all services; 175,705+ records queried. | Primary authoritative store for users, questions, sessions, transcripts, and AI reports. | **ACTIVE** |
| **MongoDB** | **YES** | **NO** | 0 drivers installed; 0 connections established. | Planned in initial boilerplate, but superseded by PostgreSQL JSON/Text storage. | **UNUSED** |
| **Redis** | **YES** | **NO** | 0 drivers installed; explicitly flagged `isUsed: false` in admin diagnostics. | Planned for caching/queues, but architecture uses stateless JWTs and in-memory queues. | **UNUSED** |

---

## 13. Answers to Key Audit Questions

1. **Why is PostgreSQL used in this project?**
   PostgreSQL provides ACID compliance, strong relational constraints, and rich JSON/Text support required for multi-round interviews, candidate profiles, question catalogs, and longitudinal skill tracking.
2. **Why is MongoDB in the project?**
   MongoDB was included in the initial `docker-compose.yml` template under the assumption that unstructured documents (transcripts, resumes) would need a NoSQL database. In practice, PostgreSQL's JSON and Text columns proved sufficient, so MongoDB was never integrated into the application code.
3. **Why is Redis in the project?**
   Redis was provisioned in `docker-compose.yml` for potential session caching and BullMQ job queues. The application was built with stateless JWT authentication and an in-memory execution semaphore, leaving Redis unintegrated.
4. **Which database is the primary authoritative database?**
   **PostgreSQL** (`nm_interview_db`).
5. **Which database stores permanent data?**
   **PostgreSQL**.
6. **Which database stores temporary / cache / queue data?**
   Temporary execution queuing is handled **in-memory** by Node.js (`ExecutionQueue.ts`); all persistent session states reside in **PostgreSQL**.
7. **Is MongoDB actually necessary?**
   **No.** MongoDB is completely unused.
8. **Is Redis actually necessary?**
   **No.** Redis is completely unused in the current architecture.
9. **Are any of the three databases currently redundant?**
   **Yes. Both MongoDB and Redis are redundant** in the current architecture.
10. **Is there any database configuration that can safely be removed later?**
    Yes. The `mongodb` and `redis` service blocks in `docker-compose.yml`, along with their associated volumes (`mongo_data`, `redis_data`) and environment variables (`MONGO_*`, `REDIS_*`), can be safely removed without affecting platform functionality.

---

## 14. Recommended Next Actions

1. **Optional Docker Cleanup**: If system resource conservation is desired, the `mongodb` and `redis` containers in `docker-compose.yml` can be commented out or stopped (`docker stop nm_mongodb nm_redis`) to reclaim RAM and CPU cycles.
2. **Environment Variable Pruning**: Remove unused `MONGO_*` and `REDIS_*` keys from `.env` and `.env.example` to reduce developer onboarding confusion.
3. **PostgreSQL Maintenance**: Continue using PostgreSQL as the single unified data store, leveraging its native JSON indexing (`jsonb`) if complex querying over stored AI report payloads is needed in future milestones.
