# Deferred Items - Phase 04

## Pre-existing Test Failures (04-01)

### TransferResults.test.tsx
- Tests check for "playlist created" text but component only shows playlist name
- Tests check for "tracks added" but component shows "added"
- Tests assert `text-green-400` but light theme uses `text-green-600`

### TransferProgress.test.tsx
The following test failures exist in `src/components/TransferProgress.test.tsx` and are not caused by Phase 04 changes:

1. **progress bar width matches percentage** - Test expects `role="progressbar"` but component doesn't have this ARIA role
2. **transitions from matching to creating** - Test expects matching -> creating transition behavior
3. **transitions from creating to adding** - Test expects creating -> adding transition behavior
4. **progress bar has accessible name** - Test expects `aria-valuenow` and `aria-valuemax` attributes

**Root cause:** TransferProgress component implementation doesn't match test expectations for ARIA attributes.

**Recommendation:** Fix TransferProgress component to add proper ARIA progressbar role and attributes.

---
*Logged: 2026-03-14*
