# Naan Mudhalvan Mock Interview Platform — Administrator Portal Guide

This guide provides login credentials, available routes, operational metrics, and architecture details for the **Administrator Role** in the NM Mock Interview Sandbox.

---

## 🔑 Administrator Login Credentials

Use the following verified credentials to log in to the Administrator Portal:

| Field | Value |
| :--- | :--- |
| **Portal URL** | [http://localhost:5173/login](http://localhost:5173/login) |
| **Email** | `admin@nm.edu` |
| **Password** | `123456` |
| **Assigned Role** | `ADMINISTRATOR` |
| **Administrator Name** | System Administrator |
| **Designation** | Super Administrator |
| **Department** | System Operations & Quality Assurance |
| **Authorization Scope** | Platform-Wide |

---

## 🚀 Quick Start Instructions

1. Ensure the platform servers are running:
   - **Frontend App**: `http://localhost:5173`
   - **API Gateway**: `http://localhost:3000`
   - **Interview Service**: `http://localhost:3004`
   - **User Service**: `http://localhost:3002`
   - **Auth Service**: `http://localhost:3001`
   - **Question Bank Service**: `http://localhost:3005`
   - **Judge0 Execution Node**: `http://localhost:3006`
2. Open your browser and navigate to the login page: [http://localhost:5173/login](http://localhost:5173/login).
3. Enter `admin@nm.edu` and `123456`.
4. Upon successful authentication, you will be automatically redirected to the **Admin Dashboard**:  
   👉 [http://localhost:5173/admin/dashboard](http://localhost:5173/admin/dashboard)

---

## 📊 Admin Dashboard Capabilities & Features

The Admin Dashboard provides **platform-level visibility** derived exclusively from authentic PostgreSQL database records:

### 1. Platform-Wide KPI Summary (8 Core Cards)
- **Total Registered Users**: Complete deduplicated count of unique clean platform identities (**8 Total Users**: 5 Students, 2 Faculty, 1 Administrator).
- **Completed Assessments**: Total finalized and evaluated candidate interview sessions across all cohorts (**34 Finalized Sessions**).
- **Active In-Progress**: Real-time evaluation sessions currently underway (**8 Active Sessions**).
- **Platform Average Score**: Authoritative mean overall score across all finalized assessment reports (**45.8%**).
- **Official Code Submissions**: Total official `SUBMIT` attempts (**93 Submissions**) with test runs partitioned (**78 Test Runs**).
- **Coding Acceptance Rate**: Percentage of official submissions passing all test cases (**34.5%**).
- **Published Benchmark Questions**: Active curricular questions curated for assessments (**45 Published**, out of 175,677 total database records).
- **System Health Status**: Real-time health status across all 6 microservices (**OPTIMAL**).

### 2. Platform Activity & Performance Trend
- Interactive **AreaChart** visualizing historical evaluation dates against mean cohort scores and session volume.
- Derived purely from real finalized `reportSnapshot` timestamps without synthetic data points.

### 3. Assessment Lifecycle & Component Scoring
- **Session Progress Ratio**: Visual ratio of Completed (34) vs In-Progress (8) sessions out of 42 total.
- **Component Averages**: Aptitude mean (65.3%), Coding mean (17.2%), and HR Behavioral mean (21.3%).
- **Template Registry**: 36 total interview templates (1 Active Published, 35 Archived).

### 4. Coding & Execution Ecosystem
- **Strict RUN vs SUBMIT Partitioning**: Test runs (78) for local candidate testing separated from official evaluated submissions (93).
- **Official Verdict Distribution**:
  - **Accepted**: 10 (34.5%)
  - **Wrong Answer**: 4 (13.8%)
  - **Compilation Error**: 8 (27.6%)
  - **Runtime Error**: 7 (24.1%)
  - **Time Limit Exceeded**: 0 (0.0%)
- **Test Case Aggregate Pass Rate**: Real executed test cases passed (23.3%).

### 5. Question Bank & Curricula Overview
- **Curated vs Full Dataset**: 45 Active Published benchmark items vs 175,677 total question records.
- **Top Curricular Domains**: Aptitude (116,856), SQL (56,115), Programming (2,627), HR (53), Algorithms (12), Operating Systems (10).

### 6. Live System Health & Microservices Monitoring
- Real-time HTTP ping probes displaying port numbers, operational status, and response latency:
  - **API Gateway** (Port 3000)
  - **Auth Service** (Port 3001)
  - **User Service** (Port 3002)
  - **Interview Service** (Port 3004)
  - **Question Bank Service** (Port 3005)
  - **Judge0 Execution Node** (Port 3006)
- **Database Status**: PostgreSQL cluster (`auth_db`, `user_db`, `interview_db`, `question_db`) connected.

### 7. Operational Attention Signals & Recent Activity Stream
- **Evidence-Based Alerts**: Flags active in-progress sessions, execution failure logs, and draft templates.
- **Recent Platform Activity Stream**: Chronological real-time event feed of assessment completions, code submissions, and score updates.

---

## 🛡️ Security & Role-Based Access Control (RBAC)

- **Frontend Route Protection**: Guarded by `RoleGuard` (`allowedRoles={['ADMINISTRATOR']}`).
- **Backend API Authorization**: Enforced on `GET /api/v1/admin/dashboard` by `requireAdmin` middleware.
- **Access Isolation**:
  - Students attempting to access `/admin/*` receive **403 Forbidden**.
  - Faculty attempting to access `/admin/*` receive **403 Forbidden**.
- **Data Protection**: Hidden test case inputs and expected outputs are strictly protected and never exposed over public APIs.

---

## 🔌 Admin API Endpoints

| Method | Endpoint | Description | Authorization |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard` | Platform-wide KPIs, activity trend, health probes, and activity stream | `ADMINISTRATOR` |
| `GET` | `/api/v1/interviews/admin/dashboard` | Direct interview service proxy for admin dashboard | `ADMINISTRATOR` |
| `POST` | `/api/v1/auth/register/admin` | Register additional administrative accounts | Public / Seed |

---

## 🧪 Verification & Integrity Testing

To run the automated data integrity and authorization test suite:

```bash
npx tsx C:\Users\JP\.gemini\antigravity-ide\brain\261b4732-0d9f-4ccf-b90d-4fd09fce1ff1\scratch\test-admin-dashboard-integrity.ts
```

**Results**: 16/16 tests passing, confirming role isolation, exact mathematical denominators, and zero fabricated metrics.
