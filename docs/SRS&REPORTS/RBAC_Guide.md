# Role-Based Access Control (RBAC) Guide

The RBAC system relies on robust enforcement both at the API level (Gateway) and the UI level (React Router).

## JWT Role Claims
Authentication payloads include a `roles` array (e.g., `["STUDENT"]`, `["FACULTY"]`).
The frontend `AuthStore` persists these roles in Zustand state.

## `<RoleGuard>` Component
The `RoleGuard` is a structural wrapper in the React Router that intercepts navigation events.
```tsx
<RoleGuard allowedRoles={['FACULTY']}>
  <PortalLayout />
</RoleGuard>
```
If a user attempts to access a path they lack permissions for, the `RoleGuard` instantly replaces the history state and redirects them to the `/unauthorized` standard 403 page.
