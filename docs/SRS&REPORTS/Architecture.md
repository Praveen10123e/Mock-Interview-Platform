# Architecture

## Services Overview

- **Auth Service**: Handles authentication, authorization, RBAC, and JWT issuing.
- **User Service**: Manages profiles, dashboards, and role configurations (Students, Faculty, Admins).
- **Interview Service**: Orchestrates the interview session lifecycle, socket connections, and syncing events.
- **Question Bank Service**: Manages CRUD for coding questions, test cases, and difficulty metrics.
- **Judge Service**: Proxies to Judge0, evaluates submissions in isolated Docker environments.
- **AI Interview Service**: Coordinates the LLM API, prompt engineering logic, speech-to-text, and dialogue generation.
- **Behavior Analytics Service**: Consumes interview logs and analyzes stress, communication, and soft skills using NLP/ML models.
- **Scoring Service**: Aggregates inputs from Judge, AI, and Analytics services to produce the final multi-factor metric.

## Shared Packages

- **@nm/types**: Global TS interfaces.
- **@nm/config**: Env schemas.
- **@nm/errors**: Base errors.
- **@nm/logger**: Winston/Pino logging.
- **@nm/middleware**: Common express middleware.
