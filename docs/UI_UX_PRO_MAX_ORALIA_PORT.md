# UI/UX Pro Max → Oralia Design Port

This document records how the `nextlevelbuilder/ui-ux-pro-max-skill` repo should influence Oralia.

## Source authority

The repo is a UI/UX reasoning and design-system skill, not a drop-in Oralia frontend. It provides searchable design rules, product categories, styles, palettes, typography, charts, motion, accessibility, and framework guidance.

Use it as a design intelligence layer alongside `ORALIA_MASTER_BUILD_SPEC.md` and the approved Oralia mockup images.

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

## Motion standard

Motion should be subtle and useful:

- 150–300 ms for small feedback.
- 300–600 ms for screen reveals and cards.
- Transform and opacity over layout-affecting properties.
- No aggressive bounce, neon effects, spinning gimmicks, or distracting animation loops.
- Respect reduced-motion expectations.
- Animated chart reveals should clarify data, not decorate it.

## iOS implementation

SwiftUI should use:

- `CelestialBackground` for soft ambient motion.
- `HeroOracleCard` for primary panels.
- `SectionCard` for calm glass-like cards.
- Animated `ScoreRing` and `ScoreBar` for dashboard metrics.
- Gentle opacity/offset transitions between onboarding steps and guide sections.
- Future chart work should animate rings, chart nodes, map city cards, and relationship overlays.

## React/web implementation

React surfaces should use:

- Framer Motion or GSAP-style principles from the UI/UX Pro Max motion dataset.
- Page transitions capped around 250 ms for exits and 300–500 ms for entries.
- Staggered dashboard card reveals with low offsets.
- Chart animations with direct labels and accessible summaries.
- `prefers-reduced-motion` support.

## Chart/graph standard

For Oralia charts:

- Astrology chart rings should reveal progressively.
- Human Design centers should tap/expand with clear explanations.
- Daily score rings and bars should animate on load.
- Places map cards should transition smoothly.
- Chart meaning must not rely on color alone.
- Every visual chart needs readable labels or a text summary.

## Current implemented pass

Implemented on iOS main branch:

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

## Remaining visual work

Still required before claiming pixel-level mockup parity:

1. Build exact screen-by-screen layout against approved mockups.
2. Replace default SwiftUI form controls with custom Oralia input components.
3. Add custom astrology chart visuals and motion.
4. Add Human Design bodygraph styling and tap states.
5. Add Places map card transitions and custom callouts.
6. Add custom loading skeletons.
7. Add image/illustration assets matching the mockups.
8. Create a full component inventory and visual regression screenshots.
