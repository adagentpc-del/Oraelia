# Oralia — Personal Intelligence App

## Overview

Oralia is a premium personal intelligence platform combining astrology, Human Design, numerology, chakras, daily check-ins, relationship overlays, location strategy, and AI-generated guidance (daily, weekly, monthly). Version 2.0 adds a full esoteric computation engine (`lib/astro-engine`) — natal astrology, timing/forecasting, astrocartography, synastry, decision intelligence — and a native SwiftUI iOS app (`apps/ios`).

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
- **AI**: OpenAI integration (gpt-5-mini) for guidance, relationship summaries, location strategies, pattern analysis

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
- `apps/ios` — Native SwiftUI iOS app (XcodeGen project; see `apps/ios/README.md`)

### Astro Engine (`lib/astro-engine`)
Pure-TypeScript, zero-dependency computation library:
- **Ephemeris** — Julian dates, JPL Keplerian elements (1800–2050), truncated lunar theory (Meeus), Chiron, mean Node/Lilith, speeds/retrogrades, declination/out-of-bounds, moon phases
- **Natal** — Placidus/whole-sign houses, angles + vertex, dignities, dispositors/mutual receptions, element/modality/hemisphere balance, dominants, chart shape (Jones), Arabic Parts, sect
- **Aspects** — 12 aspect types with orbs, intensity/harmony scoring, applying/separating; patterns: Grand Trine, T-Square, Grand Cross, Yod, Kite, Mystic Rectangle, Stellium
- **Timing** — transits, annual/monthly profections, solar/lunar returns, secondary progressions, solar arc, lunations + eclipse detection (validated vs. real 2026 eclipses), planetary hours, daily category scoring
- **Astrocartography** — ASC/DSC/MC/IC lines, relocation angles, 80-city scored database with per-category rankings
- **Synastry** — cross-aspects, house overlays, composite + Davison, 11 compatibility scores, green/red flags
- **Numerology** — full core numbers, karmic debts, pinnacles/challenges/cycles, personal year/month/day, name/address/phone scoring, launch-date optimization
- **Human Design** — gate wheel, 88°-solar-arc design chart, type/strategy/authority, profile, definition, channels/centers, incarnation cross, variables
- **Decision engine** — synthesizes transits + profections + retrogrades + eclipses + numerology into opportunity/risk/confidence with better-window scanning
- **Interpretation** — house/planet/sign deep dives and 7 synthesized life-category reports (love, career, money, fame, family, health, spirituality)

### Shared Libraries
- `lib/db` — Drizzle ORM schema + migrations
- `lib/api-spec` — OpenAPI specification
- `lib/api-zod` — Generated Zod validation schemas
- `lib/api-client-react` — Generated React Query hooks + types

### Database Schema (10 tables)
- `users` — authentication
- `profiles` — astrology, Human Design, numerology data, guidanceTone preference
- `goals` — user goals with categories
- `daily_checkins` — mood, energy, stress, sleep tracking
- `generated_guidance` — Legacy AI-generated daily guidance
- `generated_content` — AI content cache (daily/weekly/monthly guidance, relationship overlays, location strategies, pattern summaries). Indexed on (userId, contentType, promptVersion, referenceDate/referenceId).
- `chakra_assessments` — 7-chakra energy assessments
- `relationship_profiles` — relationship mapping with AI summaries
- `location_profiles` — location strategy profiles with AI analysis
- `content_library` — knowledge base (astrology, chakras, Human Design, numerology, moon phases)

### AI Interpretation Engine
- **`buildUserContext(userId)`** — Gathers full user profile, goals, check-ins, chakra state, relationships, locations, and tone preference into a single context object
- **Prompt versioning** — Each content type has a versioned prompt template (e.g. `daily_guidance_v1`). Changing the version invalidates cached content.
- **Tone system** — 5 guidance tones: soft, direct, mystical, practical, luxury-oracle. User selects in Settings, affects all AI outputs.
- **Caching** — `generated_content` table stores AI outputs keyed by (userId, contentType, promptVersion, referenceDate/referenceId). Cache-first on all generation endpoints.
- **Regenerate** — All generation endpoints accept `{ regenerate: true }` to force fresh content. Old cached entry is deleted before saving new.
- **Fallback** — When AI is unavailable, rich fallback content is returned for all 6 content types.
- **Files**: `artifacts/api-server/src/lib/user-context.ts`, `prompts.ts`, `ai-engine.ts`

### Frontend Pages (12)
- `/` — Landing page
- `/auth` — Sign in / Create profile
- `/onboarding` — 6-step onboarding wizard
- `/dashboard` — Main dashboard with stats + Daily/Weekly/Monthly guidance tabs with Generate/Regenerate buttons
- `/profile` — Personal energy profile (astrology, Human Design)
- `/checkin` — Daily check-in form (mood, energy, stress, sleep, reflections)
- `/patterns` — Pattern intelligence with charts + Generate AI Analysis button
- `/relationships` — Relationship mapping + Generate/Regenerate AI summaries per relationship
- `/locations` — Location strategy + Generate/Regenerate AI analysis per location
- `/chakras` — Chakra assessment with radar chart
- `/library` — Knowledge library with search/filter
- `/settings` — Account, guidance tone selector (5 options), tracking toggles

### API Routes (11 modules)
- `auth` — login/register/me/logout
- `profile` — CRUD profile (includes guidanceTone)
- `goals` — CRUD goals
- `checkins` — daily check-in CRUD
- `guidance` — GET today, POST daily/weekly/monthly generation with regenerate support
- `chakra` — chakra assessments
- `relationships` — relationship profiles + POST summary generation with regenerate
- `locations` — location profiles + POST strategy generation with regenerate
- `library` — content library with search/filter
- `patterns` — GET summary, POST generate with AI analysis + regenerate
- `dashboard` — aggregated summary (reads from generated_content cache first, falls back to legacy)
- `natal` — GET /natal/chart (full computed chart), /natal/reports[/:category], /natal/deep-dives
- `forecast` — GET /forecast/daily|weekly|monthly|yearly (accepts ?date=YYYY-MM-DD)
- `astromap` — GET /astromap (lines + 80 scored cities), GET /astromap/city
- `synastry` — POST /synastry (ad-hoc partner), GET /synastry/relationship/:id
- `numerology` — GET /numerology, POST score-name, score-address, compatibility, launch-dates
- `humanDesign` — GET /human-design
- `decision` — POST /decision ({ question, category, date? })
- `profile` — also PUT /profile/birth-location ({ latitude, longitude, utcOffset }) for precise houses
- `timing` — GET /timing/transit-events (exact hits + retrograde passes), GET /timing/timeline (multi-year planning), GET /forecast/quarterly, GET /returns/solar, /returns/lunar (relocatable return charts)
- `humanDesign` — also POST /human-design/connection and GET /human-design/connection/:relationshipId (connection charts)
- `lifeEvents` — CRUD /life-events, GET /life-events/:id/analysis (timing factors at event), GET /life-events/patterns/:category

Natal chart supports `?houses=placidus|whole-sign|equal|porphyry` and `?zodiac=tropical|sidereal`, plus GET /natal/compare and /natal/draconic. All chart responses include calculation `meta` (engine/method version, source hash) and `dataQuality` (birth-time confidence model). See `docs/` for method documentation, ADRs, and build status; `lib/astro-engine/test/` holds the 55-test golden-fixture suite (`pnpm --filter @workspace/astro-engine run test`).

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Important Notes

- Auth is placeholder (auto-logs in as first user in DB)
- AI uses OpenAI when `AI_INTEGRATIONS_OPENAI_BASE_URL` is available, falls back to rich demo content with 30s timeout
- `lib/api-zod/src/index.ts` barrel export gets overwritten by codegen — must re-fix after each codegen run
- All frontend pages use generated hooks from `@workspace/api-client-react` (not custom fetch)
- Database is seeded with demo user "Luna Starweaver" and 12 library entries
- Body size limit on API server is 2MB
- typecheck:libs has pre-existing errors in integrations-openai libs (not project code) — harmless

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
