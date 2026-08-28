# Student Dashboard Architecture

## The Dashboard Aggregator Pattern
Rather than triggering multiple independent API hooks within individual React components—which inevitably creates "waterfall" loading states and fragmented loading spinners—the Student Dashboard employs the `DashboardService`.

### DashboardService (`useDashboard`)
This service acts as the central orchestrator. When a user logs in, `DashboardService.getDashboardData()` runs.
It simultaneously issues `Promise.allSettled` network requests against the API Gateway for:
- `/api/v1/profile/:id`
- `/api/v1/profile/me/completion`

It then catches the results, parses the payloads, applies graceful fallbacks, and outputs a highly-typed `DashboardDTO`. The React view (`StudentDashboard.tsx`) consumes this single DTO, ensuring exactly one loading skeleton resolves into a perfectly constructed Framer Motion staggered fade-in.

## Missing Services & Strict Empty States
As per the enterprise specification, the dashboard does *not* utilize hardcoded mock data for unbuilt backend systems (e.g. Interview Engine, Analytics). Instead, it implements strict `EmptyState` boundaries. 

For example, `EmptyStatistics` explicitly informs the user that an interview must be completed first, rather than showing a fake "85% Average Score".

## Animation Orchestration
Framer Motion `variants` are applied to the root `<motion.div>` using a `staggerChildren` property. As each widget (`WelcomeWidget`, `ProfileSummary`, `QuickActions`) mounts, they slide into view sequentially, creating a polished, highly-premium aesthetic comparable to top-tier enterprise SaaS dashboards.
