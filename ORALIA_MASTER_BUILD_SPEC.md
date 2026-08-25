# Oralia Master Build Spec

This file is the durable product/design/build authority for Oralia. It consolidates the original Claude build prompt, the later 2.0/3.0 engine work, the light/dark design mockups, and the current decision to ship the Astrocartography / Places map app first.

## Product

**Name:** Oralia  
**Category:** Energetic Personal Intelligence  
**Tagline:** Know your pattern. Plan your life.

Oralia is a premium self-knowledge and life-planning platform that maps a person’s energy, timing, relationships, locations, body rhythms, personality patterns, goals, and symbolic systems into practical guidance.

It is not just a horoscope app, not just Human Design, and not just a wellness tracker. It is a personal operating system for self-understanding, timing, relationships, place strategy, and energetic alignment.

## Product magic

Charts become patterns.  
Patterns become timing.  
Timing becomes practical guidance.

Every major output should follow the Signal to Action standard:

1. What changed
2. Why it matters
3. What to do next

## First release focus

Ship the **Astrocartography / Places map app** first.

The first public utility should answer:

- Where should I go for love, career, visibility, healing, money, creativity, writing, rest, reinvention, spirituality, and business?
- What do my planetary lines mean?
- Which cities are strongest for my current goals?
- Should I visit, move, launch, network, date, retreat, write, or rest there?
- What is guidance versus fixed fate?

Do not block the first release on finishing all of Oralia. Human Design, numerology, timing, relationship overlays, deep reports, subscriptions, practitioner mode, PDF export, and wearable integrations can expand after the map app is stable.

## Visual direction

Build with **both light and dark modes**.

The user-approved direction is gender-neutral, luxury, professional, modern, calm, mystical, elevated, and trustworthy. Green is the dominant brand color.

### Dark mode

The premium anchor mode:

- Midnight Green Black: `#081917`
- Dark Pine: `#0B2A26`
- Forest Green: `#123C35`
- Deep Emerald: `#0F5C4D`
- Sage Mist: `#A9B9AE`
- Moss Gray: `#7E9186`
- Soft Ivory: `#F6F2E9`
- Stone: `#DDD6C8`
- Champagne Gold: `#C8A96B`
- Soft Brass: `#B89054`

### Light mode

The airy luxury version:

- Soft Ivory: `#F6F2E9`
- Warm Cream: `#FAF7EF`
- Pale Sage: `#E8EFE9`
- Mist Stone: `#E1DDD3`
- Deep Emerald Text: `#123C35`
- Dark Pine Text: `#0B2A26`
- Moss Gray Text: `#5F7068`
- Champagne Gold: `#C8A96B`
- Soft Brass: `#B89054`
- Muted Sage: `#A9B9AE`

### Typography

- Headings / brand moments: Cormorant Garamond, Playfair Display, or EB Garamond.
- UI / body: Inter, Manrope, DM Sans, or Outfit.
- Default in this repo: Cormorant Garamond + Outfit.

### UI style

Use rounded cards, soft shadows, subtle glow effects, refined borders, sparse glass effects, premium spacing, elegant iconography, readable dashboards, and mobile-first responsive layouts.

Use mystical motifs lightly:

- Moon phases
- Subtle stars
- Constellation dots
- Circular orbit lines
- Celestial arcs
- Sacred geometry linework
- Astrology chart circles
- Human Design bodygraph styling
- Chakra glow points
- Mountain, sky, and horizon imagery
- Champagne gold dividers and symbols

Avoid:

- Neon purple
- Deep plum/navy as the main palette
- Childish zodiac art
- Cartoon astrology visuals
- Cheap tarot templates
- Cluttered crystal-shop aesthetics
- Overly feminine pink/peach spiritual-coach styling
- Fatalistic or fear-based copy

## Map app scope

The Places / AstroMap release should include:

- Astrocartography lines where available: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, North Node.
- Angles: ASC, DSC, MC, IC.
- Relocated angles.
- Ranked cities by category.
- Explanations of why a city ranks well.
- Practical recommendations: visit, move, launch, network, date, retreat, write, rest.
- Data-quality/confidence labels.
- Non-deterministic language.

Every city or line explanation should include:

1. What this line/place means generally
2. How it connects to the user’s chart
3. Best uses
4. Watch-outs
5. Practical action
6. Confidence / limitations

## Current architecture authority

- `lib/astro-engine` is authoritative for deterministic calculations.
- AI may synthesize, explain, personalize, and translate calculations into useful language.
- AI must never invent planetary positions, lines, houses, gates, or deterministic facts.
- Generated interpretation must be cached, prompt-versioned, and regeneratable.
- Calculated facts and interpretation must stay separate.

## Safety and language rules

Oralia is for reflection, education, self-knowledge, entertainment, and wellness-oriented planning. It is not medical, mental health, legal, financial, emergency, or fate-deterministic advice.

Use language like:

- “may support”
- “can indicate”
- “a useful way to work with this is”
- “this is better treated as a tendency, not a guarantee”

Avoid language like:

- “this will happen”
- “you are destined to”
- “this place guarantees love/money/fame”
- “this cures”
- “this proves”

## Build priority

1. Stabilize PR #1.
2. Ensure auth is production-safe.
3. Ensure `/api/astromap` works from a real user profile with birth coordinates.
4. Ensure `/places` is clear, useful, mobile-responsive, and green-luxury styled.
5. Deploy web-first unless iOS signing/App Store setup is already ready.
6. Add iOS release after MapKit smoke tests.
7. Add premium modules only after the map app is usable.

## Production blockers

Before public release:

- `DATABASE_URL` configured.
- `SESSION_SECRET` configured.
- Production demo-auth fallback disabled.
- DB migration run: `pnpm --filter @workspace/db run push`.
- AstroMap route smoke tested with a real profile.
- Web build passes.
- Auth route smoke tested.
- Legal/footer/onboarding disclaimers visible.
- No API keys exposed to frontend.
- No automatic AI calls on page load.

## Acceptance criteria for first release

- User can create an account/profile.
- User can enter birth date, birth time, birth location, and current/target locations.
- User can open Places/AstroMap.
- User can see ranked places by category.
- User can click a city or line and understand what it means.
- User receives practical guidance, not vague mystical text.
- UI matches green luxury Oralia in both light and dark modes.
- App builds and deploys without production demo-auth leakage.
