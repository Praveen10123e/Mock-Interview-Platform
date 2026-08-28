# API Gateway

The API Gateway is the central reverse proxy for the entire microservice ecosystem.

## Features
- **Service Registry**: Configuration-driven (found in `src/config/registry.ts`).
- **Proxying**: Leverages `http-proxy-middleware` to forward requests dynamically based on the path (e.g. `/api/v1/auth` -> Auth Service).
- **Correlation IDs**: Automatically passes `x-request-id` to downstream services for distributed tracing.
- **Global Error Catching**: Catch-all fallbacks for unavailable services or 404 routes.
- **Observability**: Base endpoints (`/health`, `/metrics`, `/info`) for gateway uptime tracking.

## Adding a New Service
To expose a new microservice:
1. Open `src/config/registry.ts`.
2. Add a new `ServiceRegistryEntry` with the service domain key.
3. Restart the gateway.
