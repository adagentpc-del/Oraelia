# Synastry Methods

Implementation: `src/synastry`.

## Calculations

Cross-chart aspects (0.8× orbs), house overlays (both directions), declination
parallels/contra-parallels (1°), composite (midpoint) placements, Davison
date (time midpoint; full Davison chart location-midpoint planned), key
contacts, green/red flags.

## Scores

Eleven independent 0–100 dimensions (chemistry, communication, emotional,
long-term stability, shared purpose, passion, friendship, business, conflict
risk, growth, overall). Overall is a weighted blend that cannot hide a severe
weakness — conflict risk subtracts, and every dimension ships alongside it
(spec §12).

## Unknown birth time

When either person's time is unknown (`SynastryOptions.timeKnown*`):
house overlays into that person's houses are omitted, angle-dependent claims
are suppressed, and `dataQuality.limitations` states the Moon's ±6° range.
Time-independent compatibility is still produced.

## Ethics

No claims of certainty about another person's feelings; no soulmate
guarantees; breakup analysis must not encourage surveillance or obsession
(spec §12, §24). Relationship reports carry the relationship disclaimer from
`quality/DISCLAIMERS`.
