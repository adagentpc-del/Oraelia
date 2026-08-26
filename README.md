# Oralia — iOS-First Personal Intelligence Platform

Oralia turns astrology, Human Design, numerology, astrocartography, chakras, personality/archetype patterns, timing, relationships, and goals into structured, practical guidance. It uses deterministic symbolic calculation with psychologically responsible synthesis on top.

Oralia is not a horoscope feed, not fortune telling, not only a map app, and not a substitute for professional care.

## Current release focus

The first shippable product is the **iOS app**.

The first release should deliver:

1. **Personalized Optimized Report**
   - Astrology / natal chart
   - Human Design
   - Numerology
   - Astrocartography / Places
   - Chakras
   - Personality and archetype layers
   - Relationship and compatibility layer where available
   - Timing / forecast layer
   - Strengths, weaknesses, best careers, hobbies, speaking style, relationships, locations, and life-category guidance

2. **Daily Guide**
   - Daily energetic theme
   - Best use of today
   - Avoid today
   - Career / visibility guidance
   - Relationship guidance
   - Body / chakra / nervous-system prompt
   - Moon and transit note
   - Goal nudge
   - One practical action
   - One journal prompt
   - One ritual or reset

3. **Places / Astrocartography Module**
   - MapKit astrocartography map
   - Ranked cities and location strategy
   - Planetary line and city explanations
   - Practical recommendations for visit, move, launch, network, date, write, retreat, and rest

The broader web app remains useful as a demo/support surface, but iOS is the product priority.

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
| `apps/ios` | Native SwiftUI iOS app (XcodeGen). Primary release target. |
| `lib/astro-engine` | Zero-dependency TypeScript calculation engine (ephemeris, charts, timing, astrocartography, synastry, numerology, Human Design, decisions) + golden-fixture suite |
| `artifacts/api-server` | Express 5 API (`/api/*`) |
| `artifacts/oralia` | React web frontend / support surface |
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
