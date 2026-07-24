# Oralia Build Status

Updated: 2026-07-22 · Branch: `claude/oralia-astrology-ios-app-z5y48p`

## Phase status vs. ORALIA_MASTER_BUILD_SPEC v3.0

| Phase | Status | Notes |
| --- | --- | --- |
| 0 — Audit & stabilization | ✅ | Baseline verified; all pre-existing typecheck failures fixed; whole workspace typechecks |
| 1 — Calculation foundation | ✅ | `lib/astro-engine`: deterministic ephemeris, houses, aspects; versioned meta (`oralia-astrology-2`), source hash; 55 golden-fixture tests |
| 2 — Natal chart experience | ✅ API / 🚧 UI | Full chart API incl. Placidus/Whole-Sign/Equal/Porphyry, tropical/sidereal, comparison endpoint, draconic; iOS chart wheel; web UI not yet updated |
| 3 — Life-area reports | ✅ | 7 synthesized reports with 10-part structure (evidence, higher/lower expression, confidence, disclaimers) |
| 4 — Profections & timing | ✅ | Annual/monthly profections, daily scoring, transit-event arcs with retrograde passes |
| 5 — Returns & progressions | ✅ | Solar/lunar return charts with natal overlay & relocation; secondary progressions; solar arcs |
| 6 — Numerology | ✅ | Full core + extended set (karmic lessons, hidden passion, cornerstone/capstone, Chaldean comparison, essences); transparent workings |
| 7 — Human Design | ✅ | Type/strategy/authority/profile/definition, channels/centers, variables; connection chart (companionship/dominance/compromise/electromagnetic) |
| 8 — Synastry | ✅ | Cross-aspects, overlays with unknown-time safety, declination parallels, composite/Davison, data-quality limitations |
| 9 — Astrocartography | ✅ engine / 🚧 map UX | Lines, relocation, 80-city scoring, goal rankings, local-space compass bearings; parans not yet built |
| 10 — Longitudinal intelligence | ✅ v1 | `life_events` table, per-event timing analysis, category pattern scans |
| 11 — Reports/subscriptions/practitioner | ⬜ | Not started (PDF export, entitlements, practitioner mode) |
| 12 — Hardening | 🚧 | Data-quality model + disclaimers shipped; auth is still placeholder single-user |

## Known gaps / blockers

- **Auth is placeholder** (auto-login as first user). Row-ownership checks exist but real authentication is required before production (spec §24).
- **Ephemeris**: custom Keplerian/Meeus implementation (~0.1° planets, ~0.05° Moon). A Swiss Ephemeris adapter is the documented upgrade path (ADR-0001) for arcminute-critical features (exact fixed stars, parans).
- **Alyssa QA fixture discrepancy**: spec expects "Libra Moon near 8°"; the computed Moon is ~12° Capricorn, which is consistent with the real 1989-04-21 full moon at ~1° Scorpio. ASC (23° Virgo) and Sun (6° Taurus) match the spec exactly. Flagged for product review (docs/TEST_PLAN.md).
- Web frontend does not yet surface the new engines (iOS app does).
- `ORALIA_MASTER_BUILD_SPEC.md` should be added to the repo root by the maintainer (automated copy was declined in-session).

## Verification

- `pnpm run typecheck` — passes across all packages
- `pnpm --filter @workspace/astro-engine run test` — 59/59 passing

## Latest slice (quarterly/timeline/connection)

Added: multi-year planning timeline (profections + planetary cycle markers +
progressed Moon phases), quarterly strategic forecast, HD connection charts,
Cradle / Grand Sextile / Thor's Hammer patterns, local-space astrology;
routes `/timing/timeline`, `/forecast/quarterly`, `/human-design/connection[/:relationshipId]`,
`localSpace` in `/astromap`; iOS Timeline, Life Events, and Quarterly screens.
- Eclipse predictions validated against real events (2026-08-12 solar, 2026-08-28 lunar)
