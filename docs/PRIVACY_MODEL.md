# Privacy Model

## Sensitive data classes (spec §24)

Birth records (date/time/place/coordinates/confidence), relationship profiles
(including third-party birth data), health-adjacent check-ins, location
history, life events, private notes. All are treated as sensitive personal
information.

## Current state & requirements

- **Authentication is a placeholder** (first-user auto-login). Real auth is a
  production blocker; every route already resolves the owning user and scopes
  queries by `userId`, so swapping in real auth does not require route rewrites.
- Third-party charts (relationship profiles) require an ethical/lawful reason
  affirmation in the consumer flow (UI task) and record birth-time provenance.
- No public chart URLs; report sharing must use expiring signed links (Phase 11).
- Exports and deletions must be logged (`export_requests`, `deletion_requests`
  tables planned in Phase 11/12).

## AI privacy (when connections are added)

Send calculated facts, not raw history; redact names where possible; store
model/provider/prompt-version per generation (existing `generated_content`
architecture already records prompt version and model flags); document
retention per provider in docs/INTEGRATION_MATRIX.md.

## Non-negotiables

Never place secrets or identifiable user data in source control. Test fixtures
use only data present in the build specification itself.
