# Software Requirements Specification (SRS)
## NM Mock Interview & Technical Assessment Platform

**Document Version:** 1.0.0  
**Date:** August 25, 2026  
**Status:** Approved / Active Baseline  
**System Architecture:** Distributed Microservices + React Single Page Application (SPA)

---

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive Software Requirements Specification (SRS) for the **NM Mock Interview & Technical Assessment Platform**. It specifies the functional and non-functional requirements, system architecture, role-based access control (RBAC), assessment pipeline, code execution engine, and monitoring capabilities.

### 1.2 Scope
The NM Mock Interview Platform is an enterprise-grade academic and technical preparation ecosystem designed to evaluate and enhance student readiness for technical recruitment. The platform supports:
- **Students:** Interactive mock interviews, multi-language coding sandboxes with dynamic test case verification, aptitude assessment, conversational HR interviews, and performance analytics.
- **Faculty:** Curated Question Bank management, dynamic multi-stage assessment template creation, live hierarchical student monitoring, and code submission inspection.
- **Administrators:** Platform configuration, user role provisioning, system health monitoring, and audit logging.

### 1.3 Definitions, Acronyms, and Abbreviations
- **SRS:** Software Requirements Specification
- **RBAC:** Role-Based Access Control
- **JWT:** JSON Web Token (RS256 / HS256 signed)
- **SPA:** Single Page Application (React 18 + Vite)
- **Judge0:** Sandboxed remote code execution engine for C++, Java, Python, and JavaScript
- **MCQ:** Multiple Choice Question (Aptitude & Technical)
- **AST:** Abstract Syntax Tree (Used for code analysis)

### 1.4 References
- [Architecture Documentation](file:///d:/MINI_PROJECT/docs/Architecture.md)
- [Backend Platform README](file:///d:/MINI_PROJECT/docs/Backend_Platform_README.md)
- [Student Portal Guide](file:///d:/MINI_PROJECT/docs/Student_Portal_Guide.md)
- [Faculty Portal Guide](file:///d:/MINI_PROJECT/docs/Faculty_Portal_Guide.md)
- [Project Report](file:///d:/MINI_PROJECT/project_report.md)

---

## 2. Overall Description

### 2.1 Product Perspective
The platform follows an asynchronous, loosely-coupled microservices architecture with a unified API Gateway:
- **API Gateway (Port 3000):** Central reverse proxy, JWT authentication guard, rate limiting, and route dispatcher.
- **Auth Service (Port 3001):** Identity management, credentials hashing, JWT token lifecycle, and RBAC enforcement.
- **User Service (Port 3002):** Student and Faculty profile management, department/academic tracking, and batch records.
- **Question Bank Service (Port 3003):** Curated question repository (Aptitude, Coding, HR), CRUD operations, and category tagging.
- **Interview Service (Port 3004):** Session orchestrator, template engine, candidate evaluation pipeline, and submission recording.
- **Judge Service (Port 3006):** Code compilation, sandbox execution, input/output validation, and runtime telemetry.

### 2.2 User Classes & Personas
1. **Student (`STUDENT`):**
   - Takes practice assessments and assigned mock interviews.
   - Solves aptitude MCQs, writes code in an online Monaco editor, and interacts with HR conversational prompts.
   - Views historical assessment results and detailed score cards.
2. **Faculty (`FACULTY`):**
   - Curates and manages questions in the Question Bank.
   - Builds assessment templates with mandatory stage constraints (minimum 5 Aptitude, 2 Coding, 1 Conversational HR).
   - Monitors student assessments in a clean hierarchical Student $\rightarrow$ Interview History view.
   - Inspects candidate source code, compiler outputs, runtime exceptions, and test case results.
3. **Administrator (`ADMIN`):**
   - Manages platform users, system services, security policies, and audit logs.

### 2.3 Operating Environment
- **Client Tier:** Modern web browsers (Chrome, Edge, Firefox, Safari) running React 18 + Vite SPA.
- **Server Tier:** Node.js v18+ runtime on Windows / Linux containers.
- **Database Tier:** PostgreSQL 14+ with isolated schema per microservice.
- **Execution Sandbox:** Isolated Docker / Judge0 execution daemon.

---

## 3. Specific System Requirements

### 3.1 Authentication & Authorization Module (`auth-service`)
- **REQ-AUTH-01:** The system shall authenticate users using secure email and bcrypt-hashed password credentials.
- **REQ-AUTH-02:** Upon successful authentication, the system shall issue signed JWT access tokens containing user `identityId`, `email`, and assigned `roles`.
- **REQ-AUTH-03:** The system shall reject unauthorized requests with HTTP 401 and role-mismatched requests with HTTP 403 Forbidden.
- **REQ-AUTH-04:** Faculty accounts (e.g. `faculty@nm.edu`) shall strictly possess the `FACULTY` role and be barred from student test queues.

### 3.2 Question Bank Management Module (`question-bank-service`)
- **REQ-QB-01:** The system shall maintain curated, persistent datasets for Aptitude, Coding, and HR Interview questions.
- **REQ-QB-02:** Coding problems shall specify problem descriptions, starter code snippets, input/output constraints, visible test cases, and protected hidden test cases.
- **REQ-QB-03:** Aptitude questions shall support multiple choice options, correct answer keys, category tags, and explanations.
- **REQ-QB-04:** Faculty shall be able to filter questions by category, subcategory, difficulty (`EASY`, `MEDIUM`, `HARD`), and search keywords.

### 3.3 Assessment Template Engine (`interview-service`)
- **REQ-TMP-01:** Faculty shall be able to create assessment templates specifying duration, passing score, and question selection mode (`RANDOM` vs `MANUAL`).
- **REQ-TMP-02 (Stage 1 Validation):** Every template must contain at least 5 Aptitude questions.
- **REQ-TMP-03 (Stage 2 Validation):** Every template must contain at least 2 Coding problems (with balanced difficulty: 1 Easy + 1 Medium/Hard).
- **REQ-TMP-04 (Stage 3 Validation):** Every template must contain at least 1 Conversational HR question module.
- **REQ-TMP-05 (Random Generation):** In `RANDOM` mode, each student session dynamically selects distinct questions from the curated question bank at runtime.

### 3.4 Code Execution & Judge Engine (`judge-service`)
- **REQ-EXE-01:** The system shall support sandboxed code execution in Python, Java, C++, and JavaScript.
- **REQ-EXE-02:** The system shall distinguish between temporary testing attempts (`RUN`) and official grading attempts (`SUBMIT`).
- **REQ-EXE-03:** The execution engine shall return status codes: `ACCEPTED`, `WRONG_ANSWER`, `COMPILATION_ERROR`, `RUNTIME_ERROR`, `TIME_LIMIT_EXCEEDED`, and `MEMORY_LIMIT_EXCEEDED`.
- **REQ-EXE-04 (Protected Test Cases):** Hidden test cases must protect input and expected output data from student visibility.

### 3.5 Faculty Monitoring & Submission Inspector
- **REQ-MON-01 (Hierarchical Structure):** The main Faculty Interviews page shall show only ONE row/card per unique student, grouped by verified student identity.
- **REQ-MON-02 (Student History):** Clicking "View History" shall navigate to a dedicated Student Interview History view showing all chronological attempts sorted newest first.
- **REQ-MON-03 (Code Inspection):** Faculty shall be able to inspect the exact source code submitted by the candidate with character count, copy support, stdout, stderr tracebacks, and per-test-case validation.

---

## 4. Non-Functional Requirements

### 4.1 Performance & Responsiveness
- API Gateway response latency for authenticated routes shall remain under 150ms.
- Code execution sandbox shall complete runs within 5 seconds per test case.
- Frontend Single Page Application shall load within 2 seconds.

### 4.2 Security & Data Protection
- Passwords must be hashed using `bcrypt` with a work factor of 10.
- All backend services communicate through the API Gateway with JWT validation.
- SQL injection prevention via Prisma ORM parameterized queries.

### 4.3 Reliability & Fault Tolerance
- Database failures in non-critical modules shall degrade gracefully without taking down auth and core session services.
- Code execution errors (e.g. infinite loops, memory exhaustion) must terminate cleanly without crashing backend workers.

---

## 5. Document Revision History

| Version | Date | Description | Author |
|---|---|---|---|
| 1.0.0 | August 25, 2026 | Initial Comprehensive SRS Baseline | Antigravity AI Team |
