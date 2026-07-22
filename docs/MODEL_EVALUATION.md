# Model Evaluation

No AI model is wired in this build (connections are added by the maintainer).
This file defines the evaluation frame that applies the moment one is.

## Evaluation dimensions (spec §26)

Evidence fidelity (every claim traces to a supplied engine fact) · contradiction
handling (does not flatten conflicting factors) · non-generic specificity ·
no invented placements (hard fail) · appropriate uncertainty · no deterministic
fear (hard fail) · usefulness · tone compliance · safety boundaries (hard fail).

## Method

- Fixture charts (test suite fixtures + Alyssa) → generate each report type →
  score against the dimensions above; hard-fail dimensions gate deployment.
- Store per-run: model id, prompt key+version, method version, source hash,
  scores, reviewer notes (schema: `model_runs`, `evaluation_cases` — Phase 11).
- Regression rule: a prompt or model change reruns the full fixture set before
  the `active` flag flips.

## Current status

Deterministic fallback content acts as the reference baseline; AI output must
beat it on usefulness and specificity without losing evidence fidelity.
