# Product Decisions

| # | Decision | Rationale | Status |
| --- | --- | --- | --- |
| 1 | Custom deterministic TS ephemeris now, Swiss Ephemeris adapter later | Zero-dependency, licensing-clean, arcminute accuracy sufficient for current features; adapter seam documented (ADR-0001) | Active |
| 2 | Placidus default, Whole Sign for profections | Matches mainstream practice + traditional method (ADR-0002) | Active |
| 3 | Mean node & mean Lilith, labeled in meta | Simplicity; true node planned | Active |
| 4 | Modern rulers for chart ruler/dispositors, traditional for dignity/sect/profections | Serves both interpretive schools without conflation | Active |
| 5 | Daily "profections" labeled Oralia planning synthesis | No universal traditional daily method — honesty over false authority (spec §9) | Active |
| 6 | Deterministic engine output ships without AI; AI layers on top later | User adds connections at the end; engine must be independently verifiable (spec §0.23) | Active |
| 7 | iOS native SwiftUI client, server-side computation | Single source of calculation truth; thin clients | Active |
| 8 | Alyssa fixture Moon encoded as computed (Capricorn), spec value flagged | Astronomical consistency check contradicts the spec's Libra value; needs 2-source verification before changing | Needs product review |
| 9 | Charts computed on demand + hashed meta, not persisted per-point tables yet | Simpler; spec §19 chart tables deferred until caching pressure/practitioner mode | Active |

Open questions for product:
- Confirm Alyssa Moon baseline (see docs/TEST_PLAN.md).
- Subscription tiers & entitlement service timing (Phase 11).
- Which AI provider(s) for the synthesis layer and their retention terms.
