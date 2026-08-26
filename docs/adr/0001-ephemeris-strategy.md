# ADR-0001: Ephemeris strategy — custom deterministic TS now, Swiss Ephemeris adapter later

Status: Accepted · Date: 2026-07-22

## Context

The spec requires deterministic, reproducible, LLM-free astronomical
calculation and recommends Swiss Ephemeris. Swiss Ephemeris carries AGPL/dual
licensing implications and a native/WASM dependency; the current environment
required a zero-dependency build the maintainer can run anywhere.

## Decision

Implement a pure-TypeScript ephemeris in `lib/astro-engine`:
JPL approximate Keplerian elements (1800–2050) for planets, Meeus solar theory,
truncated ELP lunar theory, mean node/Lilith, Keplerian Chiron. Accuracy:
planets ≈0.1° (validated ±0.5° at J2000), Moon ≈0.05° (validated by correct
real-eclipse prediction), Chiron ±1–2° (labeled approximate).

`bodyPosition(body, jd)` is the single seam. A Swiss Ephemeris adapter
implementing the same signature upgrades precision without touching any
downstream module, and `methodVersion` will be bumped when it lands.

## Consequences

- Sufficient for signs, houses, aspects, profections, returns, HD gates/lines,
  astrocartography at city scale.
- Not sufficient for: exact fixed-star conjunctions, HD color/tone/base,
  paran minute-precision, dates outside 1800–2050. These stay feature-gated
  until the adapter lands.
