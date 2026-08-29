# UI/UX Pro Max → Oralia Full Design Pass

This document records how the `nextlevelbuilder/ui-ux-pro-max-skill` repo should influence Oralia.

## Source authority

The UI/UX Pro Max repository is a UI/UX reasoning and design-system skill, not a drop-in Oralia frontend. It provides searchable design rules, product categories, styles, palettes, typography, charts, motion, accessibility, and framework guidance.

Use it as a design intelligence layer alongside `ORALIA_MASTER_BUILD_SPEC.md` and the approved Oralia mockup images.

## Approved visual reference

The Oralia dual-theme mockup is the visual authority:

- **Default Light mode:** ivory, cream, sage, soft pearl champagne, deep emerald text.
- **Dark mode:** deep green, black pine, restrained pearl accents, celestial glow.
- Same product structure in both modes.
- No mustard yellow.
- No harsh yellow gold.
- No masculine crypto-dashboard visual language.
- No generic SwiftUI/iOS gray form screens.
- No cheap zodiac/cartoon/tarot visual system.

## Oralia design target

Default experience:

- Light mode first.
- Ivory / cream background.
- Sage and pale green panels.
- Pearl champagne accents only, never mustard yellow.
- Deep emerald text hierarchy.
- Soft celestial linework, orbit rings, stars, moon arcs.
- Feminine-neutral luxury, not masculine crypto dashboard.
- Calm, premium, editorial, mystical, professional.

Dark mode:

- Secondary companion mode.
- Deep green / black pine.
- Pearl accents, not yellow-gold.
- No generic iOS black/gray.

## Motion standard from UI/UX Pro Max

Motion should be subtle and useful:

- 150–300 ms for small feedback.
- 300–600 ms for screen reveals and cards.
- Transform and opacity over layout-affecting properties.
- No aggressive bounce, neon effects, spinning gimmicks, or distracting animation loops.
- Respect reduced-motion expectations.
- Animated chart reveals should clarify data, not decorate it.

## Chart/graph standard from UI/UX Pro Max

For Oralia charts:

- Astrology chart rings reveal progressively.
- Score rings and bars animate on load.
- Human Design centers should tap/expand with clear explanations.
- Places map cards should transition smoothly.
- Relationship overlays should use direct labels and summaries.
- Chart meaning must not rely on color alone.
- Every visual chart needs readable labels or a text summary.

## iOS implementation standard

SwiftUI should use:

- `CelestialBackground` for soft ambient motion.
- `HeroOracleCard` for primary panels.
- `SectionCard` for calm glass-like cards.
- Animated `ScoreRing` and `ScoreBar` for dashboard metrics.
- Animated `ChartWheel` reveal for natal chart.
- Custom settings/onboarding/report surfaces instead of default `Form` or generic `List` where the user sees core product value.
- Gentle opacity/offset transitions between onboarding steps and guide sections.

## React/web implementation standard

React surfaces should use:

- Framer Motion or GSAP-style principles from the UI/UX Pro Max motion dataset.
- Page transitions capped around 250 ms for exits and 300–500 ms for entries.
- Staggered dashboard card reveals with low offsets.
- Chart animations with direct labels and accessible summaries.
- `prefers-reduced-motion` support.

## Current implemented pass

Implemented on iOS `main` branch:

- Default light mode.
- Mustard/yellow removed from theme.
- GitHub link removed from Settings.
- Developer API settings hidden under Advanced.
- Celestial background component.
- Premium hero card component.
- Animated score rings.
- Animated score bars.
- Daily Guide upgraded with premium hero structure.
- Onboarding upgraded with premium hero structure and step transitions.
- Report screen replaced with premium Oralia cards and synthesis hero.
- Report detail pages moved onto the celestial design surface.
- Settings replaced with custom Oralia cards instead of default SwiftUI form styling.
- Natal Chart screen moved onto the celestial design surface.
- Natal chart wheel now animates in with a soft reveal and subtle breathing motion.

## Remaining visual work before claiming pixel-level mockup parity

1. Build exact screen-by-screen layout against approved mockups.
2. Replace every remaining default SwiftUI form control with custom Oralia input components.
3. Add full Human Design bodygraph styling and tap states.
4. Add Places map card transitions and custom callouts.
5. Add custom loading skeletons.
6. Add image/illustration assets matching the mockups.
7. Add visual regression screenshots from Xcode simulator.
8. Add App Store-ready screenshots after the iOS build is visually approved.
