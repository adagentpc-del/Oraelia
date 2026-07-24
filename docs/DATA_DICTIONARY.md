# Data Dictionary

Schema source of truth: `lib/db/src/schema/`. Types are exported per table.

| Table | Purpose | Notable columns |
| --- | --- | --- |
| users | auth identity | email, password (scrypt hash), **email_verified_at** |
| **auth_tokens** | one-time tokens | type (password_reset\|email_verify), token_hash (SHA-256, raw never stored), expires_at, used_at |
| profiles | birth data + preferences | birthday, birthTime, birthCity, **birthLatitude/Longitude/UtcOffset**, **birthTimeConfidence** (exact_documented\|exact_recalled\|approximate_within_15_minutes\|approximate_within_1_hour\|unknown\|rectified), guidanceTone, hd*, sunSign, lifePathNumber |
| goals | user goals | category |
| daily_checkins | mood/energy/stress/sleep | |
| chakra_assessments | 7-chakra self-reports | |
| relationship_profiles | partner data | birthday, birthTime, **birthLatitude/Longitude/UtcOffset**, relationshipType |
| location_profiles | saved locations | |
| **life_events** | longitudinal pattern log | eventType, eventDate (YYYY-MM-DD), category, intensity (1-10), outcome |
| content_library | knowledge base | |
| generated_guidance | legacy AI cache | |
| generated_content | AI cache | (userId, contentType, promptVersion, referenceDate/Id) |

## Derived (not stored)

Charts, transits, profections, returns, numerology, Human Design, astro-map
scores are computed on demand from `lib/astro-engine` and carry `meta`
(engine/method version + source hash) so they can be cached with correct
invalidation. Chart persistence tables (`natal_charts`, `chart_points`, …)
from spec §19 are a Phase 11 concern once caching pressure warrants it.

## Migration

`pnpm --filter @workspace/db run push` (drizzle-kit push, dev). New columns:
profiles.birth_latitude/longitude/utc_offset/birth_time_confidence;
relationship_profiles.birth_latitude/longitude/utc_offset; table life_events.
