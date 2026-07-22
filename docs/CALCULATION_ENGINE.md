# Calculation Engine

All symbolic math is deterministic TypeScript in `lib/astro-engine`. No LLM is
ever used for positions, cusps, aspects, dates, numerology arithmetic, Human
Design activations, or map geometry (spec §0.8, §5).

## Pipeline

```
Birth data → BirthMoment (date, time, utcOffset, lat, lon)
  → Julian day (core/julian.ts)
  → positions (core/ephemeris.ts)
  → houses & angles (core/houses.ts)
  → chart facts (natal/chart.ts): dignities, dispositors, balance, patterns
  → derived engines: timing, astrocartography, synastry, HD, numerology
  → interpretation layer (interpret/*) — template synthesis from stored facts
```

## Ephemeris implementation

- **Planets** (Mercury–Pluto): JPL approximate Keplerian elements + rates,
  valid 1800–2050. Accuracy ≈ arcminutes (validated ±0.5° at J2000; typically ±0.1°).
- **Sun**: Meeus low-accuracy solar theory with aberration (±0.01°).
- **Moon**: truncated ELP (Meeus ch. 47, 32 longitude + 17 latitude terms), ≈0.05°.
  Validated by correct prediction of the real Aug 2026 eclipses.
- **Chiron**: Keplerian orbit anchored to the 1996 perihelion (±1–2°, labeled approximate).
- **Nodes / Lilith**: mean formulas (`nodeType: "mean"`, `lilithType: "mean"` in meta).
- **Speed/retrograde**: central difference over ±0.5 day.
- **Declination / out-of-bounds**: from ecliptic → equatorial conversion.

## Houses

Placidus (fixed-point semi-arc iteration; Porphyry fallback beyond ±66° latitude),
Whole Sign, Equal, Porphyry. Angles: ASC, MC, DSC, IC, Vertex, Anti-Vertex.

## Zodiacs

Tropical (default) and sidereal via linear Lahiri ayanamsa approximation
(`lahiriAyanamsa`). Draconic positions via `draconicPositions`.

## Versioning

Every chart carries `meta`:

```json
{
  "calculationEngine": "oralia-astro-engine",
  "engineVersion": "1.1.0",
  "methodVersion": "oralia-astrology-2",
  "zodiac": "tropical",
  "houseSystem": "placidus",
  "nodeType": "mean",
  "lilithType": "mean",
  "ayanamsaDegrees": null,
  "sourceHash": "fnv1a-of-inputs"
}
```

Increment `METHOD_VERSION` (natal/chart.ts) whenever an algorithm change alters
output; the hash makes stale caches detectable.

## Upgrade path

Swiss Ephemeris (or equivalent) behind an adapter is the planned replacement
for arcminute-critical features — see docs/adr/0001. The `bodyPosition`
signature is the seam: an adapter only needs to implement it.
