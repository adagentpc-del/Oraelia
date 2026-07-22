# ADR-0003: Deterministic engine first, AI synthesis layered later

Status: Accepted · Date: 2026-07-22

## Context

The maintainer will attach AI connections after the build. The spec mandates
that LLMs never produce chart facts and that every engine be independently
verifiable without AI.

## Decision

All interpretation currently ships from deterministic template synthesis over
calculated facts (`interpret/*`), with `evidence` arrays exposing the source
placements. The existing versioned-prompt + cached-content architecture
(`ai-engine.ts`, `generated_content`) is the insertion point: AI prompts will
receive engine JSON as their only factual source and fall back to the
deterministic output on failure.

## Consequences

- The product is fully functional without any AI key.
- AI can only improve prose quality; a prompt regression cannot corrupt facts.
- Evaluation (docs/MODEL_EVALUATION.md) compares AI output against the
  deterministic baseline.
