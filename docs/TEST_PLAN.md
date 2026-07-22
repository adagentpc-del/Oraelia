# Test Plan

Run: `pnpm --filter @workspace/astro-engine run test` (node:test via tsx, 55 tests).

## Deterministic coverage

- Julian day (J2000 golden value, round-trip, UTC-offset handling)
- Obliquity, planetary longitudes at J2000 (±0.5°), retrograde states
- Moon phases and lunation alternation
- Eclipse prediction vs. the real 2026-08-12 (solar) and 2026-08-28 (lunar) events
- House systems: Placidus (via Alyssa fixture), Whole Sign, Equal, Porphyry
- Sidereal ayanamsa shift; draconic rotation; calculation-meta determinism & hashing
- Traditional layer consistency (sect, benefics, joys)
- Numerology arithmetic: life path + karmic debt, master preservation (33),
  karmic lessons, pinnacle continuity, personal cycles ranges, essences
- Human Design: gate-wheel anchor (302° = 41.1), 88° design arc, channel/center consistency
- Profection house cycling at ages 0/1/9/12/24/35
- Transit events: ordering, windowing, retrograde multi-pass arcs
- Solar/lunar returns: longitude match to natal (±0.01°/±0.05°), window bounds
- Synastry unknown-time safety; data-quality scoring; astro-map bounds
- Daily/decision score bounds

## Alyssa QA fixture (spec §26)

1989-04-26 16:20 CDT, Saint Louis Park MN. **Verified matches**: Ascendant
23° Virgo (spec: ~23 Virgo ✓), Sun 6°36' Taurus (spec: ~6 Taurus ✓).
**Discrepancy**: spec expects "Libra Moon near 8°"; computed Moon is ~12°
Capricorn. Independent check: the full moon of 1989-04-21 was at ~1° Scorpio;
five days later the Moon is necessarily in Capricorn, and the engine's lunar
theory correctly predicts real eclipses. The spec's Moon expectation appears to
be an error — flagged for verification against two professional sources before
changing either the spec or the fixture.

## Gaps

- No HTTP-level integration tests yet (routes are thin wrappers over the tested engine).
- Golden fixtures still to add: pre-1900 date, southern hemisphere chart,
  polar-latitude fallback, DST transition minute, leap day.
