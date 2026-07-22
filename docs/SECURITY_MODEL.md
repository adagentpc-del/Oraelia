# Security Model

## Authorization

- Row-level ownership: every table with user data carries `user_id`; all new
  routes filter by the resolved user's id (see `lifeEvents`, `synastry`).
- Placeholder auth is the top production blocker — replace with session/JWT
  auth before any deployment with real users; add rate limiting at the API
  gateway at the same time.

## Input validation

- Drizzle-zod insert schemas validate mutations (`insertLifeEventSchema`, etc.).
- Hand-rolled numeric validation on coordinate/date inputs (bounds-checked).
- Body size limit 2 MB on the API server.

## Secrets

- No secrets in the repo. AI/base-URL configuration via environment variables
  (`AI_INTEGRATIONS_OPENAI_BASE_URL` pattern).

## Audit & future work (Phase 12)

`audit_events`, `consent_records`, `security_events` tables; signed expiring
report links; export logging; deletion workflow; admin role separation;
prompt-injection review for the AI layer (AI receives only engine facts, which
limits injection surface).
