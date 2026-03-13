# Deferred Items - Phase 03

## Pre-existing Test Failures

These test failures existed before this plan's execution and are unrelated to the Lucide icon changes:

### FileDropzone.test.tsx
- Test expects "Drag and drop Spotify JSON files here" but actual text is "Drag and drop Spotify JSON files" (no "here")

### TransferProgress.test.tsx
- Tests expect `role="progressbar"` on an SVG circle element which doesn't have that ARIA role
- Tests affected by framer-motion animation opacity (elements hidden during render)

### TransferResults.test.tsx
- Tests expect text "/playlist created/i" which doesn't exist in component
- framer-motion animation causes elements to have `opacity: 0` during initial render

## Recommended Fix
Update tests to:
1. Match actual text content in components
2. Use proper ARIA roles or remove progressbar role expectations
3. Wait for framer-motion animations or mock them
