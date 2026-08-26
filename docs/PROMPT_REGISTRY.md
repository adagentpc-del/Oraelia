# Prompt Registry

Source: `artifacts/api-server/src/lib/prompts.ts` (+ `PROMPT_VERSIONS`).

| Key | Version | Purpose | Fallback |
| --- | --- | --- | --- |
| daily_guidance | v1 | Daily guidance narrative | Rich static content |
| weekly_guidance | v1 | Weekly overview | Rich static content |
| monthly_guidance | v1 | Monthly planning | Rich static content |
| relationship_overlay | v1 | Relationship summary | Rich static content |
| location_strategy | v1 | Location analysis | Rich static content |
| pattern_summary | v1 | Check-in pattern analysis | Rich static content |

## Rules (spec §18)

- Changing a prompt requires a version bump; the cache key includes the version.
- Prompts must consume engine-calculated facts and are prohibited from
  inventing placements, dates, or numbers.
- Structured output: JSON schema per report type (executiveSummary, themes,
  evidence, higherExpression, lowerExpression, actions, timingWindows,
  limitations, disclaimer) — to be enforced when AI connections are added.
- Tone modes (soft/direct/mystical/practical/luxury-oracle) modify style only.

## Planned prompt additions (with AI connections)

natal_synthesis, life_area_report (×7), transit_narrative, return_reading,
synastry_report, decision_narrative, human_design_reading — each will receive
the corresponding engine JSON as its only factual source.
