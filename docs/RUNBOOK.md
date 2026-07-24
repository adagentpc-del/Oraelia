# Runbook

## Local development

```bash
pnpm install
pnpm run typecheck                              # whole workspace
pnpm --filter @workspace/astro-engine run test  # engine test suite (55)
pnpm --filter @workspace/db run push            # apply schema (needs DATABASE_URL)
pnpm --filter @workspace/api-server run dev     # API on :5000
```

iOS: `cd apps/ios && xcodegen generate && open Oralia.xcodeproj` (macOS, Xcode 15+).

## Deploy checklist

1. `pnpm run build` green.
2. DB migration applied (`db push` in dev; generate SQL migrations for prod),
   then apply RLS: `psql "$DATABASE_URL" -f lib/db/rls.sql`.
3. Required env: `DATABASE_URL`, `SESSION_SECRET` (≥16 chars), `APP_BASE_URL`.
4. Optional env: `AI_INTEGRATIONS_OPENAI_BASE_URL` (AI), `TURNSTILE_SECRET_KEY`
   (captcha), `IP_DENYLIST` (comma-separated), `RATE_LIMIT_PER_MINUTE`
   (default 300).
5. Wire a real email provider in `src/lib/email.ts` (dev adapter only logs) —
   password reset and email verification depend on it.
6. Put a CDN/WAF (e.g. Cloudflare) in front for network-layer firewall, bot
   management, and TLS.

## Common issues

- **TS6305 output-file errors**: build lib declarations first — `pnpm run typecheck:libs`.
- **api-zod barrel broken after codegen**: codegen re-adds a type-only re-export
  that shadows the zod values; keep the aliased form in `lib/api-zod/src/index.ts`
  (see the comment there).
- **Charts look wrong**: check profile birth coordinates + utc offset; without
  them houses default to New York and responses flag `approximateLocation`.
- **Method version bumps**: change `METHOD_VERSION` in `natal/chart.ts`; cached
  content keyed by source hash invalidates automatically.

## Incident notes

Calculation bugs: reproduce with a fixture in `lib/astro-engine/test/`, fix,
bump method version if output changes, never silently overwrite stored reports.
