# Changelog

## [Unreleased] — Oralia 2.0/3.0 engine build (branch `claude/oralia-astrology-ios-app-z5y48p`)

### Added
- `lib/astro-engine`: zero-dependency deterministic computation library —
  ephemeris (planets/Moon/Chiron/nodes/Lilith), Placidus/Whole-Sign/Equal/
  Porphyry houses, tropical + sidereal (Lahiri) zodiacs, draconic positions,
  dignities, dispositors, sect + traditional layer (triplicities, joys,
  benefics/malefics of sect), aspect engine with patterns, declination
  parallels, midpoints, unaspected planets, Arabic Parts, chart shapes.
- Timing: transits, transit-event arcs with retrograde passes, annual/monthly
  profections, solar & lunar return charts (relocatable, with natal overlay),
  secondary progressions, solar arcs, lunations with validated eclipse
  detection, planetary hours, daily category scoring.
- Astrocartography (lines, relocation, 80 scored cities), synastry (with
  unknown-birth-time safety and data-quality limitations), full numerology
  (core + extended: karmic lessons, hidden passion, cornerstone/capstone,
  Chaldean comparison, essence cycles, launch-date optimization), Human Design
  (gates/channels/centers, type/strategy/authority, variables), decision
  engine, deep-dive interpretation content, 7 life-area reports with the
  10-part interpretation standard (evidence, higher/lower expression,
  confidence labels, disclaimers).
- API: 11 new route modules (natal incl. compare/draconic, forecast, timing,
  returns, astromap, synastry, numerology, human-design, decision,
  life-events with longitudinal pattern scans, birth-location).
- DB: birth coordinates + `birth_time_confidence` on profiles, coordinates on
  relationship_profiles, new `life_events` table.
- Native SwiftUI iOS app (`apps/ios`) with 10 screens.
- Governance docs (`docs/`), ADRs 0001–0003, 55-test golden-fixture suite
  including the Alyssa QA fixture.

- Multi-year planning timeline (profection years + Saturn/Jupiter/Uranus/
  Chiron cycle markers + progressed Moon phases), quarterly strategic
  forecast, Human Design connection charts (electromagnetic/dominance/
  compromise/companionship channels), Cradle / Grand Sextile / Thor's Hammer
  patterns, local-space astrology bearings; iOS Timeline, Life Events, and
  Quarterly forecast screens. Engine suite now 59 tests.

- Parans (latitude bands where two planets are simultaneously angular),
  synastry report modes (romantic / business / breakup-integration with
  ethical guardrails), Markdown + JSON blueprint export
  (`GET /export/blueprint`).
- Web frontend: 8 new pages surfacing every engine — Blueprint (SVG chart
  wheel, house-system/zodiac switcher, all 7 life reports), Timing
  (today/quarter/year/decade), Places (city rankings, local space, parans),
  Numerology (core + extended + tools), Human Design, Decisions,
  Life Events, Compatibility (synastry modes + HD connection) — via an
  interim typed fetch client. Engine suite now 61 tests.

- Real authentication: scrypt password hashing (node built-in, zero new
  deps), stateless HMAC-signed cookie sessions (30d, httpOnly, Secure in
  prod), transparent re-hash of legacy plaintext rows on login, per-IP rate
  limiting on auth endpoints, and per-user scoping via `requireUserId` across
  every route (placeholder "first user" pattern removed; dev keeps a
  non-production fallback to the seeded user).

### Fixed
- Pre-existing workspace typecheck failures: api-zod barrel type-shadowing,
  p-retry v7 `AbortError` import, missing `@types/node`/`react` dev deps,
  OpenAI image `response.data` optionality, chakras page `queryKey`.
