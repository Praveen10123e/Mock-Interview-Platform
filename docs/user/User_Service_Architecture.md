# User & Profile Service Architecture

## Overview
The User Service owns all post-authentication profile information. Identity belongs strictly to the Auth Service. Communication across these domains happens purely through mapping the `identityId`.

## AI & Analytics Readiness
This service is designed specifically to feed downstream systems:
1. **AI Interviewer**: Reads `AIPreferences` (Strictness, Interview Style, Voice preferences) and `InterviewPreference`.
2. **Recommendation Engine**: Reads `CareerProfile` (Target roles, dream companies) and `ProfileSkill` mapping.
3. **Naan Mudhalvan Dashboard**: Synchronizes with `NMProfile` to update state progress and certification paths.

## Domain Model
- **`Profile`**: The aggregate root.
- **`StudentProfile` / `FacultyProfile` / `AdminProfile`**: The persona discriminators.
- **`CompletionEngine`**: A decoupled utility that traverses the `Profile` relations, outputting a live dynamic percentage, which `ProfileService` uses to update `Profile.completionPercentage`.

## Future Proofing
The repository layer interfaces cleanly with the generic abstract `IProfileCache`. While redis logic is explicitly omitted currently, the architectural seam exists for instantaneous cache dropping when read loads scale.
