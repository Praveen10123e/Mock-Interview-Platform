# NM MOCK INTERVIEW SANDBOX — PRODUCTION DEPLOYMENT RUNBOOK

> **Version**: 1.0.0-production-freeze  
> **Status**: Deployment Baseline Frozen  
> **Target Environment**: Production / Staging  

---

## 1. Executive Summary & Architectural Overview

The **NM Mock Interview Sandbox** is an enterprise-grade technical interview simulation platform featuring three sequential assessment rounds:
1. **Aptitude & Logical Reasoning**
2. **Coding & Algorithmic Judge Sandbox**
3. **AI-Assisted HR & Behavioral Interview (with real-time STT & Temporary Video Evidence)**

### Core Architecture Diagram

```
                                      ┌─────────────────────────────────────┐
                                      │   Client Browser (React + Vite)    │
                                      └──────────────────┬──────────────────┘
                                                         │ HTTPS / WSS
                                                         ▼
                                      ┌─────────────────────────────────────┐
                                      │       API Gateway (:3000)           │
                                      │   Reverse Proxy / Rate Limiter     │
                                      └───────┬──────────┬──────────┬───────┘
                                              │          │          │
                     ┌────────────────────────┼──────────┴──────────┼────────────────────────┐
                     ▼                        ▼                     ▼                        ▼
       ┌────────────────────────┐┌────────────────────────┐┌────────────────────────┐┌──────────────┐
       │   Auth Service (:3001) ││   User Service (:3002) ││ Interview Svc (:3004)  ││ Question Bank│
       │  JWT / RBAC / Sessions ││ Profiles / Resumes / NM││ Sessions / Report / AI ││    (:3005)   │
       └───────────┬────────────┘└───────────┬────────────┘└───────────┬────────────┘└───────┬────────┘
                   │                         │                         │                     │
                   └─────────────────────────┼─────────────────────────┼─────────────────────┘
                                             ▼                         ▼
                              ┌───────────────────────────────┐ ┌──────────────┐
                              │  PostgreSQL 15+ (Authoritative)│ │ Judge0 Cloud │
                              │   Prisma ORM (ACID + JSON)    │ │ Sandbox Node │
                              └───────────────────────────────┘ └──────────────┘
```

---

## 2. Microservice Manifest & Ports

| Service Name | Port | Directory Path | Runtime | Health Endpoint | Responsibility |
| :--- | :---: | :--- | :--- | :---: | :--- |
| **API Gateway** | `3000` | `apps/backend/gateway` | Node.js / Express | `GET /health`<br>`GET /services` | Unified reverse proxy, CORS enforcement, Swagger UI (`/docs`), rate limiting |
| **Auth Service** | `3001` | `apps/backend/services/auth-service` | Node.js / Express | `GET /health` | Candidate & admin identities, bcrypt passwords, JWT issuance & refresh, OTP verification |
| **User Service** | `3002` | `apps/backend/services/user-service` | Node.js / Express | `GET /health` | Profile management, academic metrics, Naan Mudhalvan IDs, resume parser & storage |
| **Interview Service** | `3004` | `apps/backend/services/interview-service` | Node.js / Express | `GET /health` | Multi-round lifecycle, STT speech transcript validation, LLM rubrics, PDF report engine |
| **Question Bank** | `3005` | `apps/backend/services/question-bank-service` | Node.js / Express | `GET /health` | Curated coding problems, aptitude MCQs, HR behavioral rubrics, test cases |
| **Judge Service** | `3006` | `apps/backend/services/judge-service` | Node.js / Express | `GET /health` | Isolated code execution sandbox, visible test verification, Judge0 bridge |
| **Frontend** | `5173` (dev)<br>`80/443` (prod) | `apps/frontend` | React 18 / Vite | Static SPA | Responsive applicant portal, code editor, audio/video capture, reports |

---

## 3. Database Dependencies Audit (Source-Code Verified)

Based on forensic source-code inspection:

| Database | Production Requirement | Status | Source-Code Evidence |
| :--- | :---: | :---: | :--- |
| **PostgreSQL** | **REQUIRED** | **ACTIVE** | Authoritative across all 5 backend microservices via Prisma ORM (`DATABASE_URL`). Stores 100% of relational schemas, ACID transactions, and structured JSON payloads (evidence lineage, DNA metrics, autopsy failure tags). |
| **MongoDB** | **NOT REQUIRED** | **DO NOT DEPLOY** | **0 dependencies in package.json**, 0 Mongoose/MongoClient instances in codebase, 0 active collections. Resumes, transcripts, and analytics are natively persisted in PostgreSQL. |
| **Redis** | **NOT REQUIRED** | **DO NOT DEPLOY** | **0 Redis/ioredis dependencies**. System uses stateless cryptographically signed JWT tokens and in-memory execution throttling (`ExecutionQueue.ts`). Explicitly documented as `status: 'DISABLED', isUsed: false` in `AdminService.ts`. |

---

## 4. Production Environment Variables Checklist

Ensure these variables are provisioned in your production environment (e.g., container secrets, Doppler, Vault, or system `.env`). **Never commit secrets to git.**

### Global & Shared
- `NODE_ENV=production`
- `PORT=3000` (for Gateway)
- `LOG_LEVEL=info`
- `CORS_ORIGIN=https://<your-production-domain>` (Comma-separated if multiple domains)

### PostgreSQL (Sole Authoritative Database)
- `DATABASE_URL=postgresql://<db_user>:<db_password>@<db_host>:5432/<db_name>?schema=public&sslmode=prefer`
- `AUTH_DATABASE_URL` (optional fallback to `DATABASE_URL`)
- `USER_DATABASE_URL` (optional fallback to `DATABASE_URL`)
- `INTERVIEW_DATABASE_URL` (optional fallback to `DATABASE_URL`)

### Authentication & JWT Security
- `JWT_SECRET=<64-character-cryptographically-random-string>`
- `JWT_REFRESH_SECRET=<64-character-cryptographically-random-string>`
- `JWT_EXPIRES_IN=1h`

### Email / Nodemailer (Password Reset & OTP)
- `EMAIL_HOST=smtp.gmail.com`
- `EMAIL_PORT=587`
- `EMAIL_USER=<your-smtp-account>`
- `EMAIL_PASSWORD=<your-app-password>`
- `EMAIL_SECURE=false`
- `EMAIL_FROM="NM Sandbox <no-reply@domain.com>"`

### AI & LLM Evaluation Engine
- `LLM_PROVIDER=GROQ` (or `OPENAI`)
- `GROQ_API_KEY=<gsk_your_groq_api_key>`
- `GROQ_MODEL=llama-3.3-70b-versatile` (or `qwen/qwen3.6-27b`)
- `OPENAI_API_KEY=` (optional fallback)

### Code Execution Sandbox (Judge Service)
- `JUDGE0_API_URL=https://ce.judge0.com` (or self-hosted Judge0 instance)
- `JUDGE0_API_KEY=` (if using RapidAPI / authenticated Judge0 instance)
- `JUDGE0_API_HOST=`
- `MAX_GLOBAL_CONCURRENT_EXECUTIONS=50`
- `MAX_CONCURRENT_EXECUTIONS_PER_USER=3`

### Frontend Application
- `VITE_API_BASE_URL=https://api.<your-production-domain>` (or leave unset if frontend is served on the same domain as the Gateway reverse proxy)

---

## 5. Build & Compilation Commands

Execute the following commands to verify and build all services for production:

```bash
# 1. Install root dependencies
npm install --frozen-lockfile

# 2. Build core shared libraries
cd packages/constants && npm run build && cd ../..
cd packages/errors && npm run build && cd ../..
cd packages/logger && npm run build && cd ../..
cd packages/config && npm run build && cd ../..
cd packages/middleware && npm run build && cd ../..
cd packages/api-base && npm run build && cd ../..

# 3. Build API Gateway
cd apps/backend/gateway && npm run build && cd ../../..

# 4. Build Backend Microservices
cd apps/backend/services/auth-service && npm run build && cd ../../../..
cd apps/backend/services/user-service && npm run build && cd ../../../..
cd apps/backend/services/interview-service && npm run build && cd ../../../..
cd apps/backend/services/question-bank-service && npm run build && cd ../../../..
cd apps/backend/services/judge-service && npm run build && cd ../../../..

# 5. Build Frontend SPA Bundle
cd apps/frontend && npm run build && cd ../..
```

Output of frontend build is located in `apps/frontend/dist`.

---

## 6. Database Migration Commands

**CRITICAL PRODUCTION SAFETY RULE**: Never run `prisma migrate reset` or `DROP DATABASE` on a production database.

To apply database migrations safely:

```bash
# For each service, deploy existing migrations without schema loss:
cd apps/backend/services/auth-service && npx prisma migrate deploy && cd ../../../..
cd apps/backend/services/user-service && npx prisma migrate deploy && cd ../../../..
cd apps/backend/services/question-bank-service && npx prisma migrate deploy && cd ../../../..
cd apps/backend/services/interview-service && npx prisma migrate deploy && cd ../../../..
cd apps/backend/services/judge-service && npx prisma migrate deploy && cd ../../../..
```

If initializing a fresh production database from schema:
```bash
npx prisma db push --skip-generate
```

To seed standard question bank (Coding, Aptitude, HR questions):
```bash
cd apps/backend/services/question-bank-service && npm run seed && cd ../../../..
```

---

## 7. Production Start Commands

### Recommended Process Management (PM2 or Systemd)

```bash
# Gateway
cd apps/backend/gateway && NODE_ENV=production node dist/src/server.js

# Auth Service
cd apps/backend/services/auth-service && NODE_ENV=production node dist/src/server.js

# User Service
cd apps/backend/services/user-service && NODE_ENV=production node dist/src/server.js

# Interview Service
cd apps/backend/services/interview-service && NODE_ENV=production node dist/src/server.js

# Question Bank Service
cd apps/backend/services/question-bank-service && NODE_ENV=production node dist/src/server.js

# Judge Service
cd apps/backend/services/judge-service && NODE_ENV=production node dist/src/server.js
```

### Static Frontend Hosting
Serve `apps/frontend/dist` via Nginx, Cloudflare Pages, AWS S3/CloudFront, or Caddy.

Nginx configuration example:
```nginx
server {
    listen 80;
    server_name candidate.yourdomain.com;

    root /var/www/apps/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/v1/ {
        proxy_pass http://localhost:3000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 8. Temporary Video Storage Architecture & Limitations

- **Storage Location**: Candidate webcam response recordings are written locally under `storage/temp_media/`.
- **Retention & Ephemeral Policy**: Recordings are temporary answer evidence. They automatically expire after approximately **1 hour** (3600 seconds) post-recording.
- **Automated Cleanup**: Expiration checks run during media queries; expired files are deleted from the disk via `InterviewMediaService.ts`.
- **Deployment Limitation Note**: Because storage uses the local node filesystem, container restarts or multi-replica horizontal autoscaling without shared persistent volumes (`PVC`) will not share temporary video files between container replicas. For multi-replica production setups, mount a shared NFS/EFS volume at `storage/` or configure S3 storage.

---

## 9. PDF Generation Architecture

- **Technology**: Pure Node.js `pdfkit` (v0.20.2).
- **No Headless Browser Dependency**: PDF generation does **not** use Puppeteer, Chromium, or Playwright. It runs natively in any standard Node.js alpine/debian container with minimal memory overhead (~15MB RAM per generation).
- **Deliverables**:
  - Individual Question Evidence Review
  - Comprehensive Executive Assessment Report
  - Full Interview Package (ZIP including PDF report, code submissions, transcripts, and active video clips)

---

## 10. Health Check Probes

Verify system health post-deployment using the following HTTP GET requests:

```bash
# Gateway & All Services Health Diagnostic
curl -s http://localhost:3000/health
curl -s http://localhost:3000/services

# Individual Microservice Health Checks
curl -s http://localhost:3001/health   # Auth Service
curl -s http://localhost:3002/health   # User Service
curl -s http://localhost:3004/health   # Interview Service
curl -s http://localhost:3005/health   # Question Bank Service
curl -s http://localhost:3006/health   # Judge Service
```

All endpoints respond with HTTP `200 OK` and JSON status payloads.

---

## 11. Troubleshooting Common Production Issues

1. **CORS Errors (`Access-Control-Allow-Origin`)**:
   - Ensure `CORS_ORIGIN` in the backend environment matches the exact protocol and domain of the frontend (e.g. `https://nm-interview.example.com`).
2. **Database Connection Failures (`P1001: Can't reach database server`)**:
   - Verify PostgreSQL host and port are reachable from the application subnet.
   - Verify `DATABASE_URL` format and connection pool limits (`?connection_limit=10`).
3. **Judge0 Code Execution Delays**:
   - If using the public CE endpoint (`https://ce.judge0.com`), rate limits may apply. Provision a private Judge0 instance or configure `JUDGE0_API_KEY`.
4. **Temporary Video Missing / 404**:
   - Video recordings expire after 1 hour by design. If access is required longer, download the Interview Package ZIP before the expiration window lapses.

---

## 12. Rollback Procedure

If a critical issue occurs post-deployment:

1. **Git Commit Baseline**:
   - Rollback to the deployment freeze baseline commit:
     ```bash
     git reset --hard HEAD
     ```
2. **Database Schema Rollback**:
   - Prisma migrations are non-destructive. If rolling back a migration, apply the corresponding down-migration script or revert to the previous migration timestamp.
3. **Container Rollback**:
   - If deploying via Docker images, redeploy the previous tagged image release (e.g. `docker pull nm-platform:v1.0.0-previous`).
4. **Zero Data Loss Guarantee**:
   - Because candidate interviews, code submissions, and reports are persisted in PostgreSQL, reverting the application code preserves all existing candidate assessment data.
