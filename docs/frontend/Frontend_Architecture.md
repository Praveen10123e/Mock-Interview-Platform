# Enterprise Frontend Architecture

## Architectural Philosophy
The frontend follows a highly strict **Feature-Based Architecture**. Domains are strictly encapsulated under `src/features/`.
It utilizes React 19 combined with Vite for exceptional compilation performance.

## Design System
- **Tailwind CSS + shadcn/ui**: All components reside inside `src/components/ui`, preventing dependency drift common with black-box component libraries.
- **Next Themes**: Seamless Light, Dark, and System modes.

## State Management
- **Zustand**: Handles standard UI and User states (`AuthStore`).
- **TanStack Query**: Handles ALL asynchronous server state, aggressively caching API outputs.
- **Security Rule**: Access Tokens are explicitly blocked from LocalStorage or Zustand persistence. They are retained strictly in a JS closure memory scope within the AuthStore, whilst the refresh token is managed purely by the API gateway as an HTTP-only secure cookie.

## Routing
Managed by React Router v7. Includes built-in abstract components for:
- `<AuthGuard>`: Asserts boolean authenticated states.
- `<RoleGuard>`: Asserts array-based RBAC overlap (e.g. `allowedRoles={['STUDENT']}`).
