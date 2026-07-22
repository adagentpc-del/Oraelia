# CLAUDE.md — working conventions for this repository

Read `ORALIA_MASTER_BUILD_SPEC.md` (build authority) and `docs/BUILD_STATUS.md`
before making changes. `replit.md` describes the current architecture.

## Hard rules

1. Never use an LLM (or hardcoded guesses) for planetary positions, cusps,
   aspects, transit dates, profections, numerology arithmetic, Human Design
   activations, or map geometry — all of that lives in `lib/astro-engine` and
   must stay deterministic and tested.
2. If a calculation algorithm changes output, bump `METHOD_VERSION` in
   `lib/astro-engine/src/natal/chart.ts` and add/adjust a golden-fixture test.
3. Interpretation must follow the standard in `docs/INTERPRETATION_ENGINE.md`
   (evidence, higher/lower expression, confidence label, disclaimer; no
   prohibited claims — see spec §24).
4. Treat birth data, relationship profiles, check-ins, life events, and
   location history as sensitive. No secrets or personal data in git.
5. Keep the app working after every slice; update `docs/BUILD_STATUS.md` and
   `CHANGELOG.md` when you finish meaningful work.

## Commands

```bash
pnpm run typecheck                              # whole workspace (must pass)
pnpm --filter @workspace/astro-engine run test  # engine tests (must pass)
pnpm --filter @workspace/api-server run dev     # run API locally
pnpm --filter @workspace/api-spec run codegen   # regen clients (then re-fix lib/api-zod/src/index.ts barrel — see comment in that file)
pnpm --filter @workspace/db run push            # dev schema push
```

## Gotchas

- `lib/api-zod/src/index.ts`: codegen re-adds a type-only re-export that
  shadows the zod schema values; keep the aliased-type form.
- Build lib declarations (`pnpm run typecheck:libs`) before package-level
  typechecks if you see TS6305 errors.
- Auth is placeholder single-user; scope every query by `userId` anyway.
- iOS Swift sources can't be compiled in Linux CI; keep models tolerant
  (optional fields, ignore unknown keys).
