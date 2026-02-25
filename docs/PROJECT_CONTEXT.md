# Project Context

## Product / Domain
**Subscription Tracker** — A web application where users can log in and manage all their recurring subscriptions (streaming services, fitness, meal plans, SaaS tools, etc.) in one place. The app tracks costs, renewal dates, and gives a clear overview of total monthly/annual spending.

Target users: Individuals and households who want to avoid subscription sprawl and stay on top of recurring expenses.

## Tech Stack
- **Language:** TypeScript
- **Framework:** Next.js 14 (App Router) — full-stack (API routes + React frontend)
- **Database:** PostgreSQL via Prisma ORM
- **Frontend:** React 18 + Tailwind CSS + shadcn/ui
- **Auth:** NextAuth.js v5 (credentials + OAuth providers)
- **Other:** Zod (validation), date-fns (date math), Recharts (spending charts)

## Commands
```bash
RUN_COMMAND="npm run dev"
TEST_COMMAND="npm test"
LINT_COMMAND="npm run lint"
BUILD_COMMAND="npm run build"
```

## Repo Conventions
- Branch naming: `feature/<ticket-id>-short-description`, `fix/<ticket-id>-short-description`
- Commit format: `feat(scope): description` / `fix(scope): description` (conventional commits)
- PR requirements: passing lint + tests, at least 1 reviewer approval

## Security & Data Policy
- Secrets management: `.env.local` (never committed); env vars in deployment platform
- PII handling: passwords hashed with bcrypt; no plaintext credentials stored
- Compliance: GDPR-aware — users can delete their account and all data

## Definition of Done
1. All acceptance criteria met.
2. Tests exist and pass (`npm test`).
3. Lint/typecheck passes (`npm run lint && tsc --noEmit`).
4. App runs locally (`npm run dev`).
5. QA issued **GO**.
6. No open approval gates.

## Design Workflow (Pencil)
- Exports: `design/exports/` (PNG, SVG, PDF)
- Specs: `design/notes.md`
- Tokens: `design/tokens.json` (optional)
