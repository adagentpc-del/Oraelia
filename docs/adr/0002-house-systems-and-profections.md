# ADR-0002: House systems and profection method

Status: Accepted · Date: 2026-07-22

## Decision

- Default house system: **Placidus** (semi-arc iteration; Porphyry fallback
  beyond ±66° latitude where Placidus is undefined).
- Selectable: Whole Sign, Equal, Porphyry via `?houses=` / `ChartOptions`.
- **Profections count from the Ascendant sign in Whole Sign terms** (the
  traditional method), with the year lord taken from traditional rulerships,
  regardless of the display house system.
- Monthly profections advance one house per month from the birthday.
- Daily granularity is labeled an "Oralia planning synthesis", not a
  traditional technique (spec §9 requires labeling non-standard hybrids).

## Consequences

Comparison endpoint (`/natal/compare`) makes system-dependence transparent to
users: it lists exactly which planets change houses between systems.
