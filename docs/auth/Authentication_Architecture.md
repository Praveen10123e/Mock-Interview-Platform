# Identity Provider (IdP) Architecture

## Overview
The Authentication Service operates as an independent Identity Provider. It issues highly secure RS256 JWTs using an asymmetric cryptographic keypair.

## Cryptography
- **Private Key**: Mounted locally within the `auth-service`. Used exclusively to sign outbound JWTs (`generateAccessToken`).
- **Public Key**: Shared across the monorepo. Used by the API Gateway and other microservices to cryptographically verify claims without needing to make synchronous network calls back to the Auth Service.

## Roles & Permissions (RBAC)
When a user authenticates, their roles (e.g., `STUDENT`, `ADMINISTRATOR`) and flattened permissions are embedded into the JWT payload. Downstream services read this payload to determine authorization boundaries locally.

## Token Lifecycle
- **Access Tokens**: Short-lived (15m), stored in memory by frontend clients.
- **Refresh Tokens**: Long-lived (7d), opaque, stored as HTTP-Only cookies to mitigate XSS. Hash validation is enforced in the database to prevent stolen token reuse (Token Rotation).
