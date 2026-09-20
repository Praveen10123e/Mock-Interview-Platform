# Backend Platform Architecture

This document describes the runtime framework powering all microservices in the Naan Mudhalvan Interview Sandbox.

## Design Philosophy
1. **Reusability First**: Every service extends standard abstract classes (`BaseApplication`, `BaseController`, etc.) from `@nm/api-base`.
2. **Zero-Configuration Routing**: Services are automatically routed through the API Gateway.
3. **Consistent Request Lifecycle**: 
   Request → Gateway (Proxy) → Service (Middleware → Validator → Auth → Controller → Service → Repo) → ResponseBuilder.

## Components
- **API Gateway (`apps/backend/gateway`)**: Unified entry point for the frontend, performing proxying and global request tracking.
- **Shared Infrastructure (`packages/*`)**: Contains logger, validations, configs, constants, middlewares, monitoring tools.
- **Microservices (`apps/backend/services/*`)**: Self-contained domain modules containing only business logic.

## Event-Driven Architecture
Services emit strongly-typed contracts defined in `@nm/types/events` through the `IEventPublisher` interface, enabling asynchronous decoupling between bounded contexts.
