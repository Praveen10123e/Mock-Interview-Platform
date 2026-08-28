# Interview Orchestration Service

The Interview Service operates as the absolute core of the Naan Mudhalvan backend platform. Unlike standard CRUD applications, this is a highly rigorous **State Machine and Orchestration Engine**. 

It owns **zero AI logic**, **no code execution environments**, and **no Question Banks**. It relies exclusively on String-based microservice references.

## Core Domain Engines

### 1. State Machine Service
Enforces strict transitions on the `Interview` aggregate root. 
- A `CANCELLED` interview can never revert to `RUNNING`.
- A `WAITING` interview can either move to `RUNNING` or `EXPIRED`.
- The `StateMachineService` enforces these mathematically, throwing `StateMachineError` on illegal mutations.

### 2. Session & Lock Service
When a student initiates an interview, an `InterviewSession` is spawned, accompanied by an `InterviewLock`. This lock records the IP address and JWT identity of the user, preventing them from opening the interview in a second tab and receiving duplicate questions.

### 3. Timer Engine & Heartbeat Service
- The `TimerEngineService` tracks `elapsedTime`, `pausedTime`, and `remainingTime`.
- The `HeartbeatService` requires continuous pings from the Frontend Dashboard. If a student disconnects and the heartbeat timestamp drifts by more than 5 minutes (`MAX_MISSED_HEARTBEAT_SECONDS`), the sweeping job automatically fails the interview via an `InterviewExpired` event.

### 4. Event Contracts (Domain Events)
All cross-service boundaries are respected through the `@nm/types` contract layer. The Interview Service aggressively publishes events like `QuestionAssigned`, `AnswerSaved`, and `SnapshotCreated` into the ether for future listeners (Analytics, Replay Engine) to consume.
