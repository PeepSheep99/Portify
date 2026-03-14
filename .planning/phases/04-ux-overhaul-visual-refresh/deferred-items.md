# Deferred Items - Phase 04

## Resolved by 04-04-PLAN (Gap Closure)

The TransferProgress.test.tsx issues listed below were resolved by 04-04-PLAN:
- Fixed percentage assertions to use unified progress values
- Removed role="progressbar" queries (component uses SVG)
- Converted todo tests to real tests

## Pre-existing Test Failures (not fixed in 04-04)

### FileDropzone.test.tsx
- **Test:** `renders dropzone area with instructions`
- **Issue:** Component text changed from "Drag and drop Spotify JSON files here" to "Drag and drop Spotify JSON files"
- **Root cause:** Component UI update in earlier phase, test not updated

### TransferResults.test.tsx (9 failures)
- Tests check for "playlist created" text but component only shows playlist name
- Tests check for "tracks added" but component shows "added"
- Tests assert `text-green-400` but light theme uses `text-green-600`
- Tests expect element structure that was changed with AnimatedNumber and glass styling

**Recommendation:** Create a follow-up plan to update FileDropzone.test.tsx and TransferResults.test.tsx to match current component implementations.

---
*Updated: 2026-03-14*
