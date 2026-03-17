# Hugo — Subscription & Insurance Tracker

Multi-module platform: subscriptions + insurance + household sharing.
Next.js 14 App Router, TypeScript, PostgreSQL (Prisma), NextAuth v5, Tailwind.

## Commands

npm run dev                              # dev server
npm test                                 # jest
npm run lint && npx tsc --noEmit         # lint + typecheck
npx prisma migrate dev --name <name>     # migration
node scripts/confluence.mjs publish      # Confluence docs

## Key Files

- `src/auth.ts` — NextAuth v5 beta config (JWT, credentials provider)
- `src/middleware.ts` — route protection (public paths list)
- `src/lib/validations/` — all Zod schemas
- `src/lib/utils.ts` — `centsToDisplay`, `displayToCents`, `toMonthlyCents`, `cn`
- `prisma/schema.prisma` — User, Subscription, InsurancePolicy, Household models

## Critical Rules

IMPORTANT: Amounts are integer cents in DB. API accepts decimal strings ("9.99").
IMPORTANT: Never edit applied Prisma migrations — create new ones.
IMPORTANT: Use Prisma singleton from `src/lib/prisma.ts`.
IMPORTANT: NextAuth v5 beta has breaking changes from v4 — always check `src/auth.ts`.

## Brand

Primary: `#4A6FA5` (slate blue) · Accent: `#C8644A` (terracotta)
Fonts: Fraunces (serif display) + Plus Jakarta Sans (UI sans)

## Workflow

- IMPORTANT: Always start in plan mode — research and plan before writing code. Get approval, then implement.
- IMPORTANT: Always create a new branch for each feature or fix (`feature/<name>`, `fix/<name>`). Never commit directly to `main`.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Run lint + typecheck + tests before committing.
- Create a PR to merge into `main`.
