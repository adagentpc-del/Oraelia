# Timing Methods

## Hierarchy (spec §8)

Natal baseline → annual profection & year-lord → slow transits → progressions →
solar arcs → solar return → eclipses/lunations → monthly profection → lunar
return → fast transits → numerology cycles.

## Profections

- **Annual**: house = (age mod 12) + 1, counted from the Ascendant sign (Whole
  Sign basis); year lord = traditional ruler of the profected sign.
- **Monthly**: advances one house per month from the annual profection,
  anchored to the birthday. This is one of several traditional variants; the
  selected method is fixed and documented here.
- **Daily**: not universally standardized — Oralia's daily outputs are an
  **Oralia planning synthesis** (spec §9) combining the monthly ruler, lunar
  motion, exact transits, and planetary hours. They are labeled as such.

## Transits

`computeTransits`: current-sky vs natal with tightened orbs (50%, Moon 60%).
`transitEvents`: daily-sampled zero-crossing scan for Mars–Pluto + Chiron
against natal points, yielding exact-hit dates with pass numbering
(first contact → retrograde revisit → final pass). Window cap 730 days.

## Returns

Newton-style iteration on longitude difference (`findReturn`). Solar and lunar
return charts are full charts at the return instant, computed for any location
(relocation supported), with a natal-house overlay and angular-planet themes.

## Progressions & solar arcs

Secondary progressions: day-for-a-year (natal JD + age). Solar arc: all points
advanced by the progressed Sun's arc. Sign changes flagged.

## Lunations & eclipses

Phase-angle iteration for New/Full Moons; eclipse when the lunation falls
within 17° (solar) / 12° (lunar) of the mean node. Validated against the real
August 2026 eclipse pair. Language around eclipses is non-catastrophic by
design (spec §24).

## Daily scoring

Category scores (0–100 displayed range 15–98) from harmony×intensity of active
transits over category-relevant planets, with retrograde adjustments; the
decision score subtracts capped penalties for hard hits and Mercury Rx.
Scores are heuristic prioritization aids, not predictions.
