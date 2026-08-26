# Oralia iOS

Native SwiftUI client for the Oralia esoteric personal intelligence engine. The iOS app is the primary release target.

Oralia combines astrology, Human Design, numerology, astrocartography, timing, relationships, chakras, personality/archetype layers, and life goals into two first-run experiences:

1. **Personalized Optimized Report**
2. **Daily Guide**

The Places / Astrocartography map is a core module inside the full app, not the whole product.

## Requirements

- macOS with Xcode 15+ or newer
- iOS 17 deployment target
- XcodeGen: `brew install xcodegen`
- Running Oralia API server from `artifacts/api-server`

## Generate and run

```bash
cd apps/ios
xcodegen generate
open Oralia.xcodeproj
```

Build and run on a simulator or device. In the app, open **More → Settings** and set the API base URL.

Default local API:

```txt
http://localhost:5000
```

The iOS simulator can reach the host machine through `localhost` when the local API is running:

```bash
pnpm --filter @workspace/api-server run dev
```

## Primary app structure

| Tab | What it shows |
| --- | --- |
| Guide | Daily guide: energetic theme, best use, avoid, career/visibility, relationships/body, action, journal prompt, ritual/reset, timing notes |
| Report | Unified optimized profile across astrology, Human Design, numerology, timing, relationships, places, chakras, archetypes, strengths, shadows, and practical guidance |
| Places | Astrocartography: MapKit places view, ranked cities, per-category location strategy, relocated angles, line influences |
| Timing | Forecasts, 10-year timeline, decision engine |
| More | Natal chart, Human Design, numerology, relationships/synastry, life events, settings, onboarding reset |

## iOS-first smoke test

Before treating the app as shippable, verify on Mac/Xcode:

1. App launches into onboarding on first install.
2. User can complete onboarding with birth name, birthday, birth time, birth location, current location, goals, career context, relationship context, and tone.
3. App opens into the main tab shell after onboarding.
4. **Guide** loads `/forecast/daily` and renders the daily guide sections.
5. **Report** loads `/natal/reports` and reads as a unified optimized report, not disconnected modules.
6. **Places** loads `/astromap` and displays city rankings/map intelligence.
7. **Timing** screens load without crashing.
8. **More** system screens load without crashing.
9. **Settings** can update API base URL and birth location.
10. Light/dark appearances remain green luxury and do not regress to plum/navy.
11. No screen uses deterministic fate language or medical/financial/legal claims.
12. Production API uses HTTPS.

## Backend preflight

From repo root:

```bash
pnpm install
pnpm run typecheck
pnpm --filter @workspace/astro-engine run test
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
```

Production requires:

- `DATABASE_URL`
- `SESSION_SECRET`
- production API URL configured in the app
- OpenAI config only if AI synthesis is enabled

## Notes

- Calculated facts come from `lib/astro-engine` through the API. AI may explain and synthesize but must never invent chart facts, gates, lines, houses, or timing data.
- Birth location settings use CoreLocation geocoding and save coordinates through `PUT /api/profile/birth-location`.
- Plain HTTP is allowed for local networking only. Production deployments should use HTTPS.
- Oralia is for reflection, self-knowledge, and planning. It is not medical, legal, financial, mental-health, emergency, or fate-deterministic advice.
