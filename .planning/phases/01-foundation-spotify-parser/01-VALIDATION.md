---
phase: 1
slug: foundation-spotify-parser
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + Testing Library |
| **Config file** | `vitest.config.mts` (Wave 0 installs) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | DEP-01 | smoke | Manual: `vercel --prod` + curl | N/A | ⬜ pending |
| 01-01-02 | 01 | 1 | DEP-02 | integration | `curl http://localhost:3000/api` | Wave 0 | ⬜ pending |
| 01-02-01 | 02 | 1 | SRC-02 | unit | `npm test -- spotifyParser.test.ts` | Wave 0 | ⬜ pending |
| 01-02-02 | 02 | 1 | SRC-03 | unit | `npm test -- spotifyParser.test.ts` | Wave 0 | ⬜ pending |
| 01-03-01 | 03 | 1 | UX-01 | unit | `npm test -- FileDropzone.test.tsx` | Wave 0 | ⬜ pending |
| 01-03-02 | 03 | 1 | SRC-01 | e2e/manual | Manual drag-drop test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.mts` — Vitest configuration
- [ ] `vitest.setup.ts` — Testing Library setup
- [ ] `src/lib/spotifyParser.test.ts` — Parser unit tests for SRC-02, SRC-03
- [ ] `src/components/FileDropzone.test.tsx` — Dropzone component tests for UX-01
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom vite-tsconfig-paths`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App deploys to Vercel | DEP-01 | Deployment is external service | 1. Run `vercel --prod` 2. Curl deployed URL |
| User can upload Spotify JSON | SRC-01 | Browser drag-drop interaction | 1. Open app in browser 2. Drag JSON file onto dropzone 3. Verify file accepted |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
