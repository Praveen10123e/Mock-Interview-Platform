# Navigation Guide

## Premium Unified Sidebar
The application uses a single unified `Sidebar.tsx` component to enforce "Don't Repeat Yourself" (DRY) principles. 
Instead of duplicating the sidebar for three different portals, it dynamically reads the `primaryRole` from the `useAuthStore` and renders the appropriate navigation configuration array.

## Header & Breadcrumbs
The `Header.tsx` is globally injected into the `PortalLayout`. It extracts the current URL using `react-router-dom`'s `useLocation()` to automatically generate dynamic breadcrumbs (e.g., `Dashboard > Student`).

## Hover States & Framer Motion
Navigation elements are supercharged with `framer-motion` layout animations. The active route indicator glides between elements, and "Coming Soon" tooltips pop up using Tailwind CSS `animate-in` mechanics.
