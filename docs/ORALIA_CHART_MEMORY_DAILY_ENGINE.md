# Oralia Chart, Memory, Daily Engine, and Interaction Architecture

This document records the next required product and UX pass for Oralia after the initial iOS design refresh.

## Product thesis

Oralia should not behave like a static chart app. It should behave like a living personal intelligence system.

The core loop is:

1. User enters birth, location, address, relationship, goal, and life context.
2. Oralia calculates fixed and time-based systems.
3. User brain dumps through voice or text.
4. Oralia stores structured memory about life events, relationships, moves, vacations, career changes, goals, conflicts, health/body themes, and emotional patterns.
5. Each day, Oralia cross-references charts, current timing, current place, memory, and active goals.
6. Oralia gives a practical plan by day and by hour.
7. User can set in-app reminders tied to the guidance.
8. User can tap any chart, icon, line, card, hour, place, person, or memory to go deeper.

## Required screen model

Every major system screen must follow this model:

1. Diagram at the top
2. Today
3. Memory
4. Overall
5. Go Deeper

### Diagram at the top

Each chart screen must start with the relevant diagram, not explanatory text.

Examples:

- Natal Chart: natal wheel at the top.
- Transits: transit bi-wheel or current sky over natal wheel at the top.
- Astrocartography / Places: map and lines at the top.
- Human Design: bodygraph at the top.
- Numerology: numerology matrix / address vibration / personal day cycle visual at the top.
- Relationship Overlay: synastry/composite/bond diagram at the top.
- Chakras: chakra body diagram at the top.
- Personality / Pattern Intelligence: pattern graph or archetype map at the top.

The diagram must be interactive. Tapping any visible element should open a deeper explanation.

## Chart screen structure

### Natal Chart

Top visual:

- Full natal wheel.
- Tap planets, houses, signs, aspects, stelliums, angles, nodes, Chiron, Lilith, Part of Fortune.
- Tapping opens: meaning, user-specific meaning, how it shows up, higher expression, shadow expression, today relevance, relationship/career/body relevance, confidence limits.

Sections:

- Today: how today's transits activate the natal chart.
- Memory: how past entries map to natal themes.
- Overall: complete natal blueprint.
- Go Deeper: planets, houses, aspects, chart shape, rulerships, dignities, elements, modalities.

### Astrocartography / Places

Top visual:

- Map with lines, current location marker, saved places, and ranked city cards.

Required inputs:

- Current location.
- Birth location.
- Saved places.
- Places visited.
- Places lived.
- Places being considered.

Required outputs:

- Best use of current location in general.
- Best use of current location today.
- Best use of current location by life category: career, visibility, relationships, rest, healing, money, creativity, family, confidence, nervous system.
- Best lines and angles near the user.
- Daily place guidance based on current location plus current transits.
- Memory of moves, trips, vacations, retreats, launches, relationship events, and career events by location.

Sections:

- Today: what this place supports today.
- Memory: what has happened here or in similar line zones.
- Overall: permanent place signature.
- Go Deeper: each line, each angle, each saved city, relocated chart notes.

### Numerology

Top visual:

- Numerology profile diagram showing life path, expression, soul urge, personality, birthday number, personal year, personal month, personal day.
- Address vibration panel.

Required inputs:

- Full birth name.
- Current legal/current name if different.
- Birthday.
- Current address.
- Past addresses where useful.
- Business name / brand name optional.

Required outputs:

- Personal day focus.
- Personal month/year context.
- Address vibration: what the home supports, what it drains, what it is best used for.
- Daily focus based on numerology plus active goals.
- Address/move memory and how life changed by place.

Sections:

- Today: personal day, address influence, recommended focus.
- Memory: names, addresses, moves, dates, patterns by address.
- Overall: life path and full numerology report.
- Go Deeper: each number, name layer, address layer, cycles.

### Human Design

Top visual:

- Bodygraph at top.
- Centers, gates, channels, authority, type, profile, strategy, incarnation cross clickable.

Sections:

- Today: how to make decisions today based on authority and conditioning patterns.
- Memory: where the user forced, waited, burned out, succeeded, or ignored authority.
- Overall: full design profile.
- Go Deeper: centers, gates, channels, variables, profile, authority, environment, digestion, sense.

### Relationships

Top visual:

- Relationship overlay / bond diagram.
- Synastry/composite/timing view where available.

Memory requirements:

- Relationship starts, endings, conflicts, repairs, intimacy themes, repeating patterns, attachment triggers, communication shifts.

Sections:

- Today: best timing for communication, repair, affection, conflict avoidance, clarity.
- Memory: relationship history and recurring patterns.
- Overall: compatibility, communication style, activation points, growth themes.
- Go Deeper: each person, each dynamic, timing cycles, repair scripts.

## Main page voice brain dump

The main Today screen needs a voice/text input system.

Working title: Daily Brain Dump.

Prompt examples:

- What is going on today?
- How are you feeling?
- What changed since yesterday?
- What are you working on in career, money, relationships, body, home, and identity?
- What feels urgent?
- What feels unclear?
- What do you need help timing?

Input modes:

- Voice note.
- Text note.
- Quick tags.
- Mood/energy slider.
- Goal selection.
- Optional relationship/person tag.
- Optional place/location tag.

Output after dump:

- Summary of what Oralia understood.
- Life areas detected.
- Memory candidates to save.
- Today's guidance adjusted.
- Hourly plan adjusted.
- Suggested reminders.
- Go deeper cards.

## Persistent memory system

Oralia must have structured long-term memory. This is separate from raw journal entries.

Memory types:

- Goal
- Career event
- Relationship event
- Move
- Vacation/trip
- Home/address change
- Health/body event
- Emotional pattern
- Creative project
- Money event
- Family event
- Identity shift
- Decision
- Win
- Setback
- Repeating theme
- User preference
- Reminder/alarm history

Each memory item should store:

- id
- user_id
- memory_type
- title
- summary
- raw_source_text optional
- source_type: voice, text, manual, imported, inferred
- occurred_at
- created_at
- updated_at
- location optional
- person_ids optional
- relationship_ids optional
- goal_ids optional
- life_areas
- emotional_tone
- intensity
- confidence
- astrology_links optional
- numerology_links optional
- human_design_links optional
- astrocartography_links optional
- tags
- archived flag

Memory behavior:

- Ask before saving sensitive inferred memories.
- Allow edit/delete/archive.
- Show why a memory is being used in a reading.
- Never present memory as fixed fate.
- Use memory to improve relevance, not manipulate emotion.

## Daily engine

The daily engine must synthesize:

- natal chart
- transits
- moon phase
- personal numerology day/month/year
- Human Design authority/type/profile
- current location and astrocartography context
- address vibration
- relationship timing if relevant
- active goals
- recent brain dumps
- saved memory
- reminders
- user preferences

Daily output:

- theme
- what changed
- why it matters
- best use of today
- avoid today
- career guidance
- relationship guidance
- money guidance
- body/nervous system guidance
- place/location guidance
- numerology focus
- decision guidance
- one action
- one journal prompt
- one ritual/reset
- hourly breakdown
- suggested reminders
- go deeper links

## Hourly plan and in-app reminders

The hourly plan is a core retention loop.

Requirements:

- Show the day by hours or power windows.
- Explain why each hour/window matters.
- Tie each hour/window to user goals and current life context.
- Let user set an in-app reminder from a suggested hour.
- Let user edit reminder title, time, sound, repeat, and note.
- Push notification should be optional and permission based.
- Reminder should live inside Oralia and not attempt to alter system alarms.
- Notification sound should be chosen from approved app sounds.
- Reminder history should become memory if the user wants.

Suggested reminder examples:

- Best hour for outreach.
- Best hour for rest.
- Best hour for conflict repair.
- Best hour for writing.
- Best hour for money/admin.
- Best hour to avoid over-explaining.
- Best hour for movement/body reset.

## Interaction and dopamine loop

Oralia should create a loop of exploration without becoming addictive or manipulative.

Loop:

1. Open Today.
2. See diagram/score/hour signal.
3. Brain dump.
4. Oralia updates reading.
5. User taps a chart element or hour.
6. User gets a deeper, personal explanation.
7. User sets one action or reminder.
8. User checks back later and records what happened.
9. Oralia learns pattern over time.

UX principles:

- Everything important is clickable.
- Every click explains why it matters to this user.
- Avoid dead-end cards.
- Avoid generic AI icons and emoji slop.
- Use custom symbolic line icons or carefully chosen SF Symbols only when they fit the brand.
- Prefer diagrams, glyph systems, soft linework, and bespoke Oralia symbols.
- Avoid loud gamification; use refined progress, reveal, and memory patterns.

## Icon direction

The current icon style must move away from generic AI/sparkle icons.

Replace overused symbols:

- generic sparkle
- robot/AI feel
- random emoji style
- loud starbursts
- default app-template icons

Use:

- custom thin-line celestial symbols
- planetary glyphs
- moon phase marks
- orbit rings
- house/angle symbols
- numerology glyph tiles
- chakra geometry
- map line glyphs
- memory thread symbols
- relationship bond arcs
- quiet hand-drawn geometry where appropriate

Icon system requirements:

- one consistent stroke width
- rounded caps
- no filled cartoon icons
- no emoji
- no neon gradient icons
- accessible labels always present

## Competitive UX references

Do not copy competing apps, but learn from what works.

Observed patterns:

- Co-Star uses daily personalized updates and push notifications as a retention loop.
- The Pattern emphasizes personal patterns, relationships, Bonds, Go Deeper content, time travel through past/future cycles, audio/written insights, and relationship timing.
- TimePassages emphasizes serious chart fidelity, natal charts, transit bi-wheels, progressions, solar arcs, daily horoscopes, and clickable chart/aspect interpretations.
- Astro Future emphasizes astrology in motion and click/tap explanations for aspect lines.

Oralia should combine:

- serious chart fidelity like professional astrology tools
- relationship and pattern memory depth
- daily push/action loop
- beautiful luxury visual system
- user-specific memory and life context
- practical action planning by hour

## Immediate implementation phases

### Phase 1: Screen architecture

- Add Today / Memory / Overall segmentation to chart screens.
- Move diagrams to the top of every chart screen.
- Make chart elements tappable.
- Add placeholder detail sheets for tapped items.

### Phase 2: Memory model

- Add database tables for memories, life events, brain dumps, goals, places, reminders, relationship events.
- Add API routes for create/read/update/delete memory.
- Add memory extraction draft from voice/text input.

### Phase 3: Voice brain dump

- Add Today voice/text input card.
- Add speech-to-text support on iOS where available.
- Add structured summary and save-memory confirmation.

### Phase 4: Daily engine

- Build server-side daily synthesis using deterministic chart facts plus memory context.
- Add hourly plan with suggested actions.
- Add current location and address vibration hooks.

### Phase 5: Reminders

- Add local notification permission flow.
- Add reminder creation from hourly plan.
- Add edit/delete/reminder history.

### Phase 6: Visual/icon system

- Replace generic symbols with custom Oralia icon components.
- Add bespoke diagram styling for natal, astrocartography, numerology, Human Design, chakras, and relationships.
- Perform screenshot-level tuning against approved mockups.

## Non-negotiable acceptance criteria

- Every major chart screen starts with its diagram.
- Every major chart screen has Today / Memory / Overall sections.
- Main Today screen has a voice/text brain dump entry.
- Memory is structured, editable, deletable, and explainable.
- Daily guidance cross-references charts, memory, goals, current location, and timing.
- Hourly plan can create in-app reminders.
- App does not use generic AI icon slop or emojis as core product icons.
- Visual system tracks the approved Oralia mockup, not default SwiftUI.
