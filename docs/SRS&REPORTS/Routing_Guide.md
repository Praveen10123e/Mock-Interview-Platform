# Routing Guide

The platform uses `react-router-dom` v6 with the `createBrowserRouter` object API.

## Structure
- `/` -> Redirects to login (bounces back if unauthenticated).
- `/login` -> The central Authentication gateway. Logs the user in and delegates routing based on role.
- `/student/*` -> Protected by `<RoleGuard allowedRoles={['STUDENT']}>`.
- `/faculty/*` -> Protected by `<RoleGuard allowedRoles={['FACULTY']}>`.
- `/admin/*` -> Protected by `<RoleGuard allowedRoles={['ADMINISTRATOR']}>`.

## Portal Layout
All three portals funnel through a single `<PortalLayout />`. This handles the viewport bounding, scrolling `main` sections, fixed Sidebars, and Header integrations.

## 404 & 403
Unknown endpoints naturally drop into `*` leading to `NotFound`.
Unauthorized role breaches drop into `/unauthorized` standard template.
