# Oralia — Personal Intelligence Platform

Oralia turns astrology, Human Design, numerology, location, and timing into structured, practical guidance — deterministic symbolic calculation with psychologically responsible synthesis on top. It is not a horoscope feed, not fortune telling, and not a substitute for professional care.

## Current release focus

The first shippable slice is the **Astrocartography / Places map app**.

This release should help a user understand:

- which places support career, love, visibility, money, creativity, healing, spirituality, writing, rest, reinvention, and business;
- what planetary lines and relocated angles mean;
- how to use a place practically without treating the map as fixed fate;
- where data quality or birth-time uncertainty limits confidence.

The broader Oralia platform remains the long-term direction, but the map app is the fastest useful release.

## Brand direction

Oralia uses a gender-neutral luxury mystical intelligence aesthetic.

- **Dark mode:** deep emerald, forest green, dark pine, soft glow, champagne gold.
- **Light mode:** soft ivory, pale sage, muted emerald, moss, champagne gold.
- **Typography:** elegant serif headings and clean modern UI text.
- **Motifs:** subtle stars, moon arcs, orbit lines, constellation dots, sacred geometry linework.
- **Avoid:** neon purple, old plum/navy dominance, childish zodiac/cartoon visuals, cheap tarot styling, clutter, and overly feminine pink/peach dominance.

Build authority: `ORALIA_MASTER_BUILD_SPEC.md`.

## Repository layout

| Path | What it is |
| --- | --- |
| `lib/astro-engine` | Zero-dependency TypeScript calculation engine (ephemeris, charts, timing, astrocartography, synastry, numerology, Human Design, decisions) + golden-fixture suite |
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

iOS app: see `apps/ios/README.md`. Operational details: `docs/RUNBOOK.md`. Status: `docs/BUILD_STATUS.md`.

## Principles

Accuracy before prose · synthesis over placement lists · every claim shows its evidence · fact separated from interpretation · tendencies, not fate · no LLM ever invents a planetary position.
