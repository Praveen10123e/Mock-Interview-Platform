# Naan Mudhalvan Mock Interview Platform — Faculty Portal Guide

This guide provides login credentials, available routes, and architecture details for the **Faculty Role** in the NM Mock Interview Sandbox.

---

## 🔑 Faculty Login Credentials

Use the following verified credentials to log in to the Faculty Portal:

| Field | Value |
| :--- | :--- |
| **Portal URL** | [http://localhost:5173/login](http://localhost:5173/login) |
| **Email** | `faculty@nm.edu` |
| **Password** | `Password123!` |
| **Assigned Role** | `FACULTY` |
| **Faculty Name** | Prof. Arun Kumar |
| **Designation** | Associate Professor / Faculty Instructor |
| **Department** | Computer Science & Engineering |
| **Institution** | Naan Mudhalvan Partner College |

---

## 🚀 Quick Start Instructions

1. Ensure the frontend and backend servers are running:
   - **Frontend**: `http://localhost:5173`
   - **API Gateway**: `http://localhost:3000`
2. Navigate to the login page: [http://localhost:5173/login](http://localhost:5173/login).
3. Enter `faculty@nm.edu` and `Password123!`.
4. Upon successful authentication, you will be automatically redirected to the **Faculty Dashboard**:  
   👉 [http://localhost:5173/faculty/dashboard](http://localhost:5173/faculty/dashboard)

---

## 📊 Faculty Dashboard Features

The Faculty Dashboard provides real-time cohort visibility derived from live database records:

1. **Dashboard Header**: Displays personalized greeting, institution, department, and quick action buttons.
2. **Summary Metric Cards**:
   - **Total Students**: Total enrolled candidates within the department/institution.
   - **Active Students**: Count of students active within the last 30 days.
   - **Assessments**: Total mock interview sessions conducted.
   - **Total Submissions**: Cumulative code execution and evaluation attempts.
   - **Avg Performance**: Real calculated score average from completed sessions (or *"Not enough data"* if pending).
3. **Performance Overview**:
   - Historical average score trend chart plotted from verified session timestamps.
4. **Students Needing Attention**:
   - Identifies candidates based on explainable criteria:
     - Average score $< 50\%$ benchmark
     - High test case failure rate ($\ge 3$ failures)
     - Inactivity / zero completed assessments
5. **Recent Activity Timeline**:
   - Real-time stream of student mock interview completions and test submissions with timestamps.
6. **Question Bank Access**:
   - Direct link to explore curated domain questions across Coding, Aptitude, and HR.

---

## 🛡️ Security & Role-Based Access

- **Route Guarding**: Faculty routes are protected by `RoleGuard` (`allowedRoles={['FACULTY']}`).
- **Access Isolation**:
  - Students attempting to access `/faculty/*` receive **403 Unauthorized / Forbidden**.
  - Faculty attempting to access `/admin/*` receive **403 Forbidden**.
- **Data Scoping**: Backend queries (`GET /api/v1/users/faculty/dashboard`) automatically scope student telemetry to the authenticated faculty member's institution and department based on the RS256 JWT `x-identity-id`.

---

## 📝 Creating Additional Faculty Accounts

You can register additional faculty members via the registration endpoint:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register/faculty \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Suresh",
    "lastName": "Raina",
    "email": "suresh.faculty@nm.edu",
    "password": "Password123!"
  }'
```
