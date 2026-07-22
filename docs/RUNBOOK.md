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
2. DB migration applied (`db push` in dev; generate SQL migrations for prod).
3. Env: `DATABASE_URL`, optional `AI_INTEGRATIONS_OPENAI_BASE_URL`.
4. Replace placeholder auth before exposure to real users (see SECURITY_MODEL).

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
