# Oralia Master Build Spec

This file is the durable product/design/build authority for Oralia. It consolidates the original Claude build prompt, the later 2.0/3.0 engine work, the light/dark design mockups, and the corrected release decision: **Oralia ships iOS-first as a full esoteric personal intelligence app**. The Places / Astrocartography map is a major module, not the entire product.

## Product

**Name:** Oralia  
**Category:** Energetic Personal Intelligence  
**Tagline:** Know your pattern. Plan your life.

Oralia is a premium iOS-first self-knowledge and life-planning app that maps a person’s astrology, Human Design, numerology, astrocartography, chakras, personality/archetype patterns, timing cycles, relationships, goals, and symbolic systems into a personalized optimized report and daily guide.

It is not just a horoscope app, not just Human Design, not just an astrocartography map, and not just a wellness tracker. It is a personal operating system for self-understanding, timing, relationships, place strategy, and energetic alignment.

## Product magic

Charts become patterns.  
Patterns become timing.  
Timing becomes practical guidance.

Every major output should follow the Signal to Action standard:

1. What changed
2. Why it matters
3. What to do next

## First release focus

Ship an **iOS app first**.

The first shippable Oralia app must deliver two core experiences:

1. **Personalized Optimized Report**
2. **Daily Guide**

The Places / Astrocartography map remains a core module inside the app, but the release should not be reduced to only a map app.

## Personalized Optimized Report

The report should synthesize multiple systems into one cohesive user-readable intelligence profile. It must feel like one unified report, not a disconnected list of modules.

Include, as available:

- Astrology / natal chart
- Human Design
- Numerology
- Astrocartography / Places
- Chakras
- Personality and archetype assessment layers
- Relationship and compatibility patterns
- Timing / forecast patterns
- Strengths and weaknesses
- Best hobbies
- Best careers
- Speaking and communication style
- Relationship style
- Best environments and location themes
- Daily, weekly, monthly, and yearly life-category guidance

The report should explain:

1. What the system says
2. What it means generally
3. What it means for the user specifically
4. How it shows up in life
5. How to use it practically
6. Higher expression
7. Shadow expression
8. Suggested action
9. Confidence / limitations
10. Relevant disclaimers

## Daily Guide

The iOS Today screen is the first-run value. It should deliver:

- Daily energetic theme
- Best use of today
- Avoid today
- Career / visibility guidance
- Relationship guidance
- Body / chakra / nervous-system prompt
- Moon and transit note
- Human Design / authority note where useful
- Numerology day-cycle note where useful
- Goal nudge
- One practical action
- One journal prompt
- One ritual or reset

This must be practical, not vague mystical text.

## Places / Astrocartography module

The Places module should include:

- MapKit astrocartography map
- Astrocartography lines where available: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, North Node
- Angles: ASC, DSC, MC, IC
- Relocated angles
- Ranked cities by category
- Explanations of why a city ranks well
- Practical recommendations: visit, move, launch, network, date, retreat, write, rest
- Data-quality/confidence labels
- Non-deterministic language

Every city or line explanation should include:

1. What this line/place means generally
2. How it connects to the user’s chart
3. Best uses
4. Watch-outs
5. Practical action
6. Confidence / limitations

## Visual direction

Build with **both light and dark modes**, but the **default must be light**.

The approved reference is the dual-mode Oralia design image with the split screen: dark green version on the left and light ivory version on the right. Treat that image as design authority.

### Theme toggle behavior

The app must expose an explicit Light / Dark toggle.

- **Light is the default** and must activate the soft ivory Oralia version.
- **Dark** must activate the deep green Oralia version.
- The screen structure should remain consistent across modes; only the palette, contrast, glow, and surface treatment should change.
- Dark mode is not black/gray generic iOS dark mode. It is rich emerald, black pine, subtle pearl accents, and cosmic glow.
- Light mode is not plain white. It is ivory/cream, pale sage, soft pearl-champagne, and low-contrast elegant cards.
- Do not use mustard yellow, harsh yellow-gold, orange gold, or heavy masculine contrast.

### Dark mode

The premium green secondary mode:

- Midnight Green Black: `#081917`
- Dark Pine: `#0B2A26`
- Forest Green: `#123C35`
- Deep Emerald: `#0F5C4D`
- Soft Emerald: muted green for fills and graphs
- Sage Mist: soft desaturated sage
- Soft Ivory: `#F6F2E9`
- Pearl Champagne: muted beige-champagne, never mustard

Dark mode should use:

- dark green full-screen backgrounds
- subtle pearl/champagne celestial icons and dividers
- faint star/orbit accents
- rounded dark cards with soft green highlights
- ivory text with refined hierarchy
- app-screen feel similar to the dark half of the approved image, but not overly masculine

### Light mode

The primary airy ivory version:

- Soft Ivory: `#F6F2E9`
- Warm Cream: `#FAF7EF`
- Pale Sage: `#E8EFE9`
- Mist Sage: very light green-gray wash
- Deep Emerald Text: `#123C35`
- Dark Pine Text: `#0B2A26`
- Moss Gray Text: muted gray-green
- Pearl Champagne: muted beige-champagne only
- Muted Sage: soft desaturated sage

Light mode should use:

- ivory/cream full-screen backgrounds
- pale sage panels and lines
- pearl-champagne celestial accents, not yellow
- soft low-contrast card borders
- deep emerald text hierarchy
- app-screen feel similar to the light half of the approved image

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
- Pearl champagne dividers and symbols

Avoid:

- Mustard yellow
- Harsh yellow-gold
- Orange gold
- Neon purple
- Deep plum/navy as the main palette
- Childish zodiac art
- Cartoon astrology visuals
- Cheap tarot templates
- Cluttered crystal-shop aesthetics
- Overly feminine pink/peach spiritual-coach styling
- Heavy masculine styling
- Fatalistic or fear-based copy

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

1. Stabilize the iOS app on `main`.
2. Treat iOS as the primary release target.
3. Verify the SwiftUI app builds on Mac/XcodeGen.
4. Ensure the iOS Today dashboard presents the Daily Guide as the primary first-run value.
5. Ensure the iOS report flow synthesizes multiple systems into a single optimized personal report.
6. Keep Places / Astrocartography as a core module.
7. Ensure auth and API deployment strategy works for iOS.
8. Keep the web app as admin/demo/support surface, not the main first release.

## Production blockers

Before public iOS release:

- iOS build verified on Mac/XcodeGen.
- API deployment available to the iOS app.
- `DATABASE_URL` configured.
- `SESSION_SECRET` configured.
- Production demo-auth fallback disabled.
- DB migration run: `pnpm --filter @workspace/db run push`.
- Auth/session flow works from iOS.
- Daily guide route and report route smoke tested with a real profile.
- AstroMap route smoke tested with a real profile.
- Legal/footer/onboarding disclaimers visible.
- No GitHub links or developer-source references visible in consumer settings.
- No API keys exposed to frontend or app bundle.
- No automatic uncached AI calls on app load.

## Acceptance criteria for first iOS release

- User can create profile and enter birth name, birthday, birth time, birth location, current location, goals, relationship/career context, and preferences.
- App generates a personalized optimized report combining astrology, Human Design, numerology, Places/astrocartography, chakras, personality/archetypes, and timing.
- App shows a daily guide with practical actions and calendar-style energetic guidance.
- App includes the Places / Astrocartography module.
- Light/Dark toggle works exactly as approved: light is the default ivory/sage version, dark is the deep green version.
- App does not use mustard yellow or harsh gold accents.
- App communicates confidence/limitations clearly and does not make deterministic fate claims.
- iOS build path is documented and smoke-tested on Mac/Xcode.
