# Interpretation Engine

## Fact vs. interpretation

Every report is generated from stored calculated facts (placements, aspects,
timing), listed in its `evidence` array. The interpretation standard (spec §36)
is enforced structurally: each life report carries `sections`, `evidence`,
`actions`, `higherExpression`, `lowerExpression`, `reflectionQuestions`,
`confidence` (high | moderate | exploratory — a label, not a probability), and
`disclaimer`.

## Layers

1. **Deep dives** (`interpret/deepDives.ts`): curated structured content for
   12 houses (meaning → psychology → lessons → timing → recommendations),
   11 planets/points, 12 signs. Static knowledge keyed to actual placements.
2. **Life reports** (`interpret/reports.ts`): synthesis across placements for
   Love, Career, Money, Fame, Family, Health, Spirituality.
3. **AI layer** (existing `artifacts/api-server/src/lib/ai-engine.ts`):
   versioned prompts + cached generated content. When AI connections are
   added, prompts receive engine facts and must never invent placements;
   deterministic engine output is the fallback.

## Prohibited claims (spec §24)

No death prediction, medical diagnosis, pregnancy declaration, guaranteed
marriage/divorce/fame/wealth, asserted infidelity, certain soulmates,
eclipse fear, or safety-critical advice substitution. Health sections carry
the non-medical disclaimer verbatim.

## Tone

Five tone modes (soft, direct, mystical, practical, luxury-oracle) affect
style only, never facts. Tone is a prompt-layer concern; the engine output is
tone-neutral.
