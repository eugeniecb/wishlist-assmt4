# Repository Guidelines

## Project Structure & Module Organization
This repository is expected to follow the assignment monorepo layout:

- `apps/web/`: Next.js frontend deployed to Vercel
- `apps/worker/`: background polling worker deployed to Railway
- `packages/`: shared types, utilities, and API helpers when duplication appears
- `supabase/`: schema, policies, seed data, and local config
- `public/`: static frontend assets
- `docs/`: architecture notes, setup notes, and `CLAUDE.md`

Keep feature code close to where it is used. Prefer `apps/web/src/components`, `apps/web/src/app`, and `apps/worker/src` over large shared folders early in the project.

## Build, Test, and Development Commands
Add scripts to the root `package.json` and keep them stable:

- `npm install`: install workspace dependencies
- `npm run dev:web`: run the Next.js app locally
- `npm run dev:worker`: run the polling worker locally
- `npm run lint`: run ESLint across the repo
- `npm run test`: run all automated tests
- `npm run build`: build deployable artifacts for all apps

If Turborepo is added, prefer commands such as `turbo run dev lint test build`.

## Coding Style & Naming Conventions
Use TypeScript throughout. Prefer 2-space indentation, semicolons, and single responsibility files. Use:

- `PascalCase` for React components
- `camelCase` for variables and functions
- `kebab-case` for route segments and file names outside components
- `UPPER_SNAKE_CASE` for environment variables

Format with Prettier and lint with ESLint. Avoid default exports for shared utilities.

## Testing Guidelines
Use `Vitest` for unit tests and `Playwright` for end-to-end tests if added. Name tests `*.test.ts` or `*.spec.ts`. Keep frontend tests near components and worker tests near polling/parsing code. Test API normalization, Supabase writes, and realtime UI updates before polishing visuals.

## Commit & Pull Request Guidelines
Recent history uses short imperative subjects such as `Add sample wishlist items` and `Fix sample item images`. Follow that pattern:

- `Add worker polling for EONET events`
- `Fix realtime subscription cleanup`

PRs should include a brief summary, affected areas, setup or env changes, and screenshots for UI changes. Link the assignment issue or task when available.

## Security & Configuration Tips
Do not commit secrets. Keep local values in `.env.local` and production values in Vercel, Railway, and Supabase dashboards. Treat `SUPABASE_SERVICE_ROLE_KEY` as server-only and never expose it to the frontend.
