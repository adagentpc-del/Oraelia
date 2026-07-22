# Oralia — Personal Intelligence Platform

Oralia turns astrology, Human Design, numerology, location, and timing into
structured, practical guidance — deterministic symbolic calculation with
psychologically responsible synthesis on top. It is not a horoscope feed, not
fortune telling, and not a substitute for professional care.

## Repository layout

| Path | What it is |
| --- | --- |
| `lib/astro-engine` | Zero-dependency TypeScript calculation engine (ephemeris, charts, timing, astrocartography, synastry, numerology, Human Design, decisions) + 55-test golden-fixture suite |
| `artifacts/api-server` | Express 5 API (`/api/*`) |
| `artifacts/oralia` | React web frontend |
| `apps/ios` | Native SwiftUI iOS app (XcodeGen) |
| `lib/db` | Drizzle ORM schema (PostgreSQL) |
| `lib/api-spec` / `lib/api-zod` / `lib/api-client-react` | OpenAPI spec + generated clients |
| `docs/` | Method docs, ADRs, build status, privacy/security models |

## Quick start

```bash
pnpm install
pnpm run typecheck
pnpm --filter @workspace/astro-engine run test
pnpm --filter @workspace/db run push        # requires DATABASE_URL
pnpm --filter @workspace/api-server run dev # API on :5000
```

iOS app: see `apps/ios/README.md`. Operational details: `docs/RUNBOOK.md`.
Build authority: `ORALIA_MASTER_BUILD_SPEC.md` (v3.0). Status: `docs/BUILD_STATUS.md`.

## Principles

Accuracy before prose · synthesis over placement lists · every claim shows its
evidence · fact separated from interpretation · tendencies, not fate · no LLM
ever invents a planetary position.
