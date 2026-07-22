# Astrology Methods

Method version: `oralia-astrology-2`

## Points

Sun–Pluto, mean North/South Node, Chiron, mean Black Moon Lilith, ASC/MC/DSC/IC,
Vertex/Anti-Vertex, Lots of Fortune, Spirit, Eros, Marriage (sect-aware where traditional).

## Rulerships & dignities

- Modern rulerships for chart ruler and dispositors (Scorpio→Pluto, Aquarius→Uranus, Pisces→Neptune).
- Traditional rulerships for dignities, sect analysis, and profection year-lords.
- Essential dignity: domicile, exaltation, detriment, fall, peregrine.
- Accidental dignity folded into a 0–100 strength score: angularity, house, speed vs. mean, retrograde, aspect count, out-of-bounds.

## Traditional layer

Sect (Sun above/below horizon), benefic/malefic of and contrary to sect,
Dorothean triplicity rulers (day/night/participating), planetary joys,
angular/succedent/cadent classification, dispositor chains, mutual receptions,
final dispositor.

## Aspects

Conjunction 8°, opposition 8°, square 7°, trine 7°, sextile 5°, quincunx 3°,
semi-square/sesquiquadrate 2°, quintile/biquintile 2°, novile 1.5°, semi-sextile 2°.
Applying/separating from current speeds. Intensity = closeness × body weight;
harmony = aspect nature × closeness. Declination parallels/contra-parallels at 1° orb.

## Patterns

Stellium (3+ in sign), Grand Trine, T-Square, Grand Cross, Yod, Kite, Mystic
Rectangle; unaspected planets; Jones chart shapes (Bundle, Bowl, Bucket,
Locomotive, See-Saw, Splash). Cradle, Grand Sextile, Thor's Hammer: not yet implemented.

## House interpretation

Each house report synthesizes cusp sign, planets in house, and current
activations (profections, transits). See `interpret/deepDives.ts`.

## Known limitations

- Mean node/Lilith only (true node planned).
- Fixed stars and asteroid points (Juno, Vesta, etc.) not yet computed.
- Sidereal uses linear Lahiri approximation (sign-level accurate).
