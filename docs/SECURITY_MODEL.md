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

## Account recovery & verification

- **Password reset**: `POST /auth/forgot-password` (always 200 — no account
  enumeration) issues a single-use, 1-hour token; only its SHA-256 hash is
  stored (`auth_tokens`). `POST /auth/reset-password` consumes it atomically
  (UPDATE … WHERE used_at IS NULL), re-hashes the password, and signs the user
  in. A successful reset also marks the email verified (inbox control proven).
- **Email verification**: registration issues a 24-hour single-use token;
  `GET /auth/verify-email?token=` consumes it; `POST /auth/send-verification`
  re-issues. `users.email_verified_at` records state; `/auth/me` exposes it.
- **Email delivery** goes through the adapter in `lib/email.ts` — the dev
  adapter logs instead of sending; wire a provider (Resend/SES/Postmark) there.

## Row-Level Security (Postgres)

`lib/db/rls.sql` enables **FORCE ROW LEVEL SECURITY** with per-user policies on
every user-data table, keyed to the `app.user_id` GUC. `runAsUser(userId, fn)`
and `runAsSystem(fn)` in `lib/db` set the GUC inside a transaction. This is
defense-in-depth beneath application scoping: once applied, a query that
forgets its WHERE clause returns nothing rather than everything. Apply with
`psql "$DATABASE_URL" -f lib/db/rls.sql`; migrations/admin work need a role
that bypasses RLS.

## Application firewall & anti-bot (`src/middlewares/security.ts`)

- **Security headers** on every response: nosniff, frame-deny, referrer-policy,
  permissions-policy, COOP, HSTS in production.
- **Request firewall**: env-driven IP denylist (`IP_DENYLIST`), path-traversal
  and SQLi/XSS probe pattern blocking (logged), and a global per-IP rate limit
  (`RATE_LIMIT_PER_MINUTE`, default 300/min). A network firewall / CDN WAF
  (e.g. Cloudflare) still belongs in front in deployment — this is the
  in-process layer that survives outer misconfiguration; it also covers the
  "malware payload" surface, since the API accepts no file uploads (any future
  upload feature must add content scanning before shipping).
- **Anti-bot** on registration: invisible honeypot field (`website`) answered
  with a fake success, scripted user-agent rejection in production, and an
  optional **Cloudflare Turnstile** captcha verified server-side when
  `TURNSTILE_SECRET_KEY` is set (client sends `captchaToken`).
- Auth endpoints have their own tighter limiters (login/register 10 per 15 min,
  reset flows 5 per 15 min).

## Prompt-injection defense (`src/lib/promptSafety.ts`)

User free text (goals, reflections, challenges, relationship notes) is treated
as untrusted before reaching any model: control/zero-width/bidi characters are
stripped, instruction-shaped phrasing ("ignore previous instructions",
role-prefix lines, chat-template control tokens) is neutralized, length is
capped, and content is wrapped in `<user_data>` envelopes. Every system prompt
gets `PROMPT_INJECTION_GUARD` appended, instructing the model to treat
user-data content strictly as material to interpret. AI output is already
schema-validated JSON, which bounds what a successful injection could do.

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
