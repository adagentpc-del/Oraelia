# Oralia iOS

Native SwiftUI client for the Oralia astrology, Human Design & esoteric
intelligence engine. Talks to the Express API in `artifacts/api-server`
(all computation happens server-side in `lib/astro-engine`).

## Requirements

- macOS with Xcode 15+ (iOS 17 deployment target)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen): `brew install xcodegen`

## Generate & run

```bash
cd apps/ios
xcodegen generate
open Oralia.xcodeproj
```

Build & run on a simulator or device. In the app, open **More → Settings**
and set the API base URL (defaults to `http://localhost:5000` for a local
`pnpm --filter @workspace/api-server run dev` server; the iOS simulator can
reach the host machine via `localhost`).

## Screens

| Tab | What it shows |
| --- | --- |
| Today | Daily forecast: decision score, life-area scores, opportunities/risks, power hours, active transits, retrogrades |
| Chart | Natal wheel (Canvas-drawn), placements with dignities, aspect patterns, chart shape, element/modality balance |
| Reports | Synthesized life-category reports: Love, Career, Money, Fame, Family, Health, Spirituality |
| Places | Astrocartography: world map of scored cities, per-category rankings, relocation details with planetary lines |
| More | Forecasts (weekly/monthly/yearly), Decision Engine, Human Design, Numerology, Synastry, Settings |

## Notes

- **Birth location**: Settings geocodes a birth city with CoreLocation and
  stores coordinates via `PUT /api/profile/birth-location`. The timezone
  offset saved is the location's *current* offset — adjust manually for
  historical DST edge cases if the birth time is near a DST boundary.
- The app is read-mostly; profile creation/onboarding currently happens
  through the web app backed by the same API and database.
- Plain-HTTP is allowed for local networking only (see `project.yml`);
  production deployments should use HTTPS.
