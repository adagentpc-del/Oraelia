# Security Model

## Authentication

Real authentication is implemented in `artifacts/api-server/src/lib/auth.ts`:

- **Passwords**: scrypt (node:crypto, N=16384, per-user random salt), stored as
  `scrypt$N$salt$hash`. Legacy plaintext rows (placeholder-auth era) are
  verified with a timing-safe compare and transparently re-hashed on the next
  successful login.
- **Sessions**: stateless HMAC-SHA256-signed tokens (`userId.expiry.signature`)
  in an httpOnly, SameSite=Lax cookie (`Secure` in production), 30-day TTL.
  `SESSION_SECRET` (≥16 chars) is required in production; dev uses an
  ephemeral random secret with a logged warning.
- **Rate limiting**: in-memory per-IP limiter on login/register
  (10 attempts / 15 min). Replace with a shared store when horizontally scaled.
- **Dev fallback**: outside production, requests without a session resolve to
  the first (seeded demo) user so local development works without logging in.
  In production, unauthenticated requests receive 401.

## Authorization

- Row-level ownership: every table with user data carries `user_id`; every
  route resolves the caller via `requireUserId(req, res)` and filters by it —
  the "first user" placeholder pattern has been removed.

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
