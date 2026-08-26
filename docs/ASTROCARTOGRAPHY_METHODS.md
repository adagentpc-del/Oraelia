# Astrocartography Methods

Implementation: `src/astrocartography`.

## Geometry

- Equatorial coordinates from ecliptic position + obliquity at the birth instant.
- **MC line**: geographic longitude where RA = LST (constant meridian); IC opposite.
- **ASC/DSC lines**: per-latitude rising/setting longitude from the semi-diurnal
  arc (H₀ = acos(−tanφ·tanδ)), sampled at 2° latitude steps between ±66°.
- **Relocation**: full angle recomputation at any coordinates (`computeAngles`).

## Influence model

Line influence within an 8° longitude orb, strength linear with closeness;
kind multipliers (ASC/MC 1.0, DSC/IC 0.8). Per-planet category effects
(e.g., Venus → love/money/creativity; Saturn → career discipline, relational
weight) produce 10 category scores + overall per city, over an 80-city
database. Every score is explainable from its line influences (spec §11).

## Not yet implemented

Parans, local-space azimuth lines, distance bands in km (current model uses
degree-orb), lived-experience logging per location. Tracked in BUILD_STATUS.
Tradeoff language (strong career line ≠ emotionally easy) is embedded in the
line meanings.
