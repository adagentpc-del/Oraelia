# Oralia — Personal Intelligence App

## Overview

Oralia is a premium personal intelligence web app combining astrology, Human Design, numerology, chakras, daily check-ins, relationship overlays, location strategy, and AI-generated daily guidance.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite + TailwindCSS v4 + shadcn/ui + Framer Motion + Recharts + wouter
- **Backend**: Express 5 + Pino logger
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **Build**: esbuild (API server), Vite (frontend)
- **AI**: OpenAI integration (gpt-5-mini) for daily guidance, relationship summaries, location strategies

## Design

- Luxury mystical intelligence aesthetic
- Palette: ivory/champagne background, deep plum primary, navy accents, gold highlights
- Typography: serif headings (Playfair Display), sans-serif body
- Warm, muted tones throughout

## Architecture

### Artifacts
- `artifacts/oralia` — React+Vite frontend (served at `/`)
- `artifacts/api-server` — Express 5 API (served at `/api`)
- `artifacts/mockup-sandbox` — Component preview sandbox

### Shared Libraries
- `lib/db` — Drizzle ORM schema + migrations
- `lib/api-spec` — OpenAPI specification
- `lib/api-zod` — Generated Zod validation schemas
- `lib/api-client-react` — Generated React Query hooks + types

### Database Schema (9 tables)
- `users` — authentication
- `profiles` — astrology, Human Design, numerology data
- `goals` — user goals with categories
- `daily_checkins` — mood, energy, stress, sleep tracking
- `generated_guidance` — AI-generated daily guidance
- `chakra_assessments` — 7-chakra energy assessments
- `relationship_profiles` — relationship mapping with summaries
- `location_profiles` — location strategy profiles
- `content_library` — knowledge base (astrology, chakras, Human Design, numerology, moon phases)

### Frontend Pages (12)
- `/` — Landing page
- `/auth` — Sign in / Create profile
- `/onboarding` — 6-step onboarding wizard
- `/dashboard` — Main dashboard with stats + daily guidance
- `/profile` — Personal energy profile (astrology, Human Design)
- `/checkin` — Daily check-in form (mood, energy, stress, sleep, reflections)
- `/patterns` — Pattern intelligence with charts
- `/relationships` — Relationship mapping + AI summaries
- `/locations` — Location strategy + AI analysis
- `/chakras` — Chakra assessment with radar chart
- `/library` — Knowledge library with search/filter
- `/settings` — Account and preferences

### API Routes (11 modules)
- `auth` — login/register/me/logout
- `profile` — CRUD profile
- `goals` — CRUD goals
- `checkins` — daily check-in CRUD
- `guidance` — AI daily guidance generation
- `chakra` — chakra assessments
- `relationships` — relationship profiles + AI summaries
- `locations` — location profiles + AI strategies
- `library` — content library with search/filter
- `patterns` — pattern analysis
- `dashboard` — aggregated summary

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Important Notes

- Auth is placeholder (auto-logs in as first user in DB)
- AI guidance uses OpenAI when `AI_INTEGRATIONS_OPENAI_BASE_URL` is available, falls back to demo content
- `lib/api-zod/src/index.ts` barrel export gets overwritten by codegen — must re-fix after each codegen run
- All frontend pages use generated hooks from `@workspace/api-client-react` (not custom fetch)
- Database is seeded with demo user "Luna Starweaver" and 12 library entries
- Body size limit on API server is 2MB

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
