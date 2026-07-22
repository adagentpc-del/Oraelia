# Human Design Methods

Implementation: `src/humanDesign`. Fully calculated, never guessed (spec §14).

## Mechanics

- Gate wheel: 64 gates × 5.625°, Gate 41 line 1 anchored at 2°00' Aquarius (302.0°); 6 lines per gate.
- Personality: positions at birth. Design: positions when the Sun was exactly
  88° of solar arc earlier (iteratively solved; verified in tests to ±0.1°).
- Activating bodies: Sun, Earth (Sun+180°), Moon, Nodes, Mercury–Pluto — both sides.
- Channels: 36 gate-pairs; centers defined by completed channels; connectivity
  graph determines motor-to-throat paths.

## Derivations

- **Type**: Reflector (no defined centers) / Generator vs Manifesting Generator
  (sacral ± motor-to-throat) / Manifestor (motor-to-throat, no sacral) / Projector (otherwise).
- **Authority hierarchy**: Solar Plexus → Sacral → Spleen → Ego (Heart→Throat) →
  Self-Projected (G) → Mental/Environmental; Reflector → Lunar.
- **Profile**: personality Sun line / design Sun line. **Definition**: connected-component count.
- **Incarnation cross**: personality Sun/Earth + design Sun/Earth gates.
- **Variables** (digestion, environment, motivation, perspective): derived from
  simplified color bands within the Sun's line. Marked lower-precision; exact
  color/tone/base requires arcsecond ephemeris precision (see ADR-0001).

## Data quality

Without a birth time, charts compute for 12:00 and the API attaches a warning:
profile, variables, and often type can shift with the exact time (spec §14).

Language standard: experiment-based ("try", "notice"), never "you cannot".
