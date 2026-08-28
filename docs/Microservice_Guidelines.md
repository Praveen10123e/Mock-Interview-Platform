# Microservice Guidelines

## Boundary Rules
1. **No Shared Databases**: Every microservice MUST own its data store.
2. **No Synchronous Coupling**: If a service requires data from another service that isn't required for an immediate HTTP response, use asynchronous events.
3. **Internal Communication**: Use `IInternalClient` for explicit synchronous HTTP calls between microservices (e.g. fetching user context).

## Core Principles (SOLID & Clean Architecture)
- **Dependency Injection**: Use DI patterns in services and controllers.
- **DTOs**: Data Transfer Objects must be strictly validated via `@nm/validation`. Never pass raw `req.body` to a `BaseService`.
- **Stateless**: Services must be entirely stateless to allow horizontal scaling.
