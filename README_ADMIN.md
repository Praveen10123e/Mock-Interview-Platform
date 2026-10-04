# Naan Mudhalvan Mock Interview Platform — Administrator Portal Guide & QA Specification

This guide provides login credentials, available routes, operational metrics, architecture details, and comprehensive QA validation records for the **Administrator Role** in the NM Mock Interview Sandbox.

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

## 🚀 Active Microservices Architecture

All backend microservices communicate via the centralized API Gateway:

- **Frontend App**: `http://localhost:5173` (Vite + React + TailwindCSS)
- **API Gateway**: `http://localhost:3000` (Reverse proxy, rate limiting, JWT token decode)
- **Auth Service**: `http://localhost:3001` (RS256 JWT issuer, bcrypt password validation)
- **User Service**: `http://localhost:3002` (Platform identity, profiles, and administrative user management)
- **Interview Service**: `http://localhost:3004` (Interview sessions, reports snapshot, analytics, AI interview chatbot)
- **Question Bank Service**: `http://localhost:3005` (Curated questions, test case management, question validation)
- **Judge0 Execution Node**: `http://localhost:3006` (Full program stdin/stdout execution engine)

---

## 🧭 Navigation & Route Map

The Admin Panel adheres strictly to the institutional light workspace theme established by `/admin/users`:

| Sidebar Item | URL Path | Status | Description |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `/admin/dashboard`, `/admin` | **ACTIVE** | Platform-wide KPIs, 9-bucket performance trend, microservice probes, alerts |
| **Users** | `/admin/users` | **ACTIVE** | Visual reference page; real user table, search, role/status/dept filters, details |
| **Question Bank** | `/admin/question-bank`, `/admin/questions` | **ACTIVE** | Coding, Aptitude, HR questions; multi-facet filters, validation modal, test cases |
| **Datasets** | `/admin/datasets` | **ACTIVE** | Centralized dataset question sources, batch imports, schema validator, JSON export |
| **System** | `/admin/system` | **ACTIVE** | Real-time health probes across all 6 microservices, PostgreSQL latency, Redis status |
| **Analytics** | `/admin/analytics` | **ACTIVE** | Longitudinal metrics, verdict distributions, language breakdown, proctoring stats |
| **Settings** | `/admin/settings` | **ACTIVE** | Admin profile, live password change (`POST /auth/change-password`), UI preferences |
| **Interactive Report** | `/admin/interviews/summary/:id` | **ACTIVE** | Full interactive report with multi-round deep dives and Ask About My Interview AI chatbot |

---

## 🛡️ Security & Role-Based Access Control (RBAC)

1. **Frontend Protection**: Enforced by `RoleGuard` (`allowedRoles={['ADMINISTRATOR', 'ADMIN']}`). Unauthorized attempts redirect directly to `/unauthorized` (HTTP 403).
2. **Backend API Enforcement**:
   - `GET /api/v1/users/admin/users`: Enforces `requireAdmin`. Unauthorized students and faculty receive HTTP 403 `Forbidden: Administrator or Super Admin privileges required`.
   - `GET /api/v1/admin/dashboard`: Enforces `requireAdmin`.
   - `GET /api/v1/interviews/faculty/sessions/reports`: Enforces `requireFaculty` (supports comma-separated roles containing `ADMINISTRATOR`). Unauthorized students receive HTTP 403.
   - `POST /api/v1/auth/change-password`: Validates current password via bcrypt, enforces minimum 8 characters, hashes and updates password in `auth_db`.
