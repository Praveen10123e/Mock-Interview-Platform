# Coding Standards

## TypeScript
- **Strict Mode**: Always keep `strict: true` in `tsconfig.json`.
- **No Any**: Avoid using `any`. Use `unknown` if a type is truly uncertain, and validate it using Zod schemas.
- **Interfaces**: Prefix interfaces with `I` only if defining a contract (e.g. `IHttpClient`).

## Formatting & Linting
- Enforced automatically by ESLint and Prettier. Run `npm run format` before pushing.

## Naming Conventions
- **Files**: `kebab-case` (e.g. `user-controller.ts`).
- **Classes**: `PascalCase` (e.g. `UserController`).
- **Methods/Variables**: `camelCase`.
- **Constants/Enums**: `UPPER_SNAKE_CASE`.
