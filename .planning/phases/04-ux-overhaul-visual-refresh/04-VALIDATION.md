---
phase: 4
slug: ux-overhaul-visual-refresh
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-14
updated: 2026-03-14
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + @testing-library/react 16.3.2 |
| **Config file** | vitest.config.mts |
| **Quick run command** | `npm run test:run -- <test-file>` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run -- <affected-component>`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Wave 0 Plan

**04-00-PLAN.md** creates test scaffolds before implementation:

| Test File | Tests For | Status |
|-----------|-----------|--------|
| `src/components/TransferBottomBar.test.tsx` | Bottom bar component (UX-04) | ⬜ pending |
| `src/components/Toast.test.tsx` | Toast component (UX-05) | ⬜ pending |
| `src/components/YouTubeAuthButton.test.tsx` | Copy toast behavior (UX-05) | ⬜ pending |
| `src/components/TransferProgress.test.tsx` | Unified progress calculation (UX-06) | ⬜ pending |

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-00-01 | 00 | 0 | UX-04,05 | scaffold | `npm run test:run -- TransferBottomBar Toast` | W0 creates | ⬜ pending |
| 04-00-02 | 00 | 0 | UX-05,06 | scaffold | `npm run test:run -- YouTubeAuthButton TransferProgress` | W0 creates | ⬜ pending |
| 04-01-01 | 01 | 1 | UX-07 | build | `npm run build` | N/A | ⬜ pending |
| 04-01-02 | 01 | 1 | UX-08,09,11 | integration | `npm run test:run` | N/A | ⬜ pending |
| 04-02-01 | 02 | 1 | UX-05 | build | `npm run build` | N/A | ⬜ pending |
| 04-02-02 | 02 | 1 | UX-05 | unit | `grep -c "showCopied" YouTubeAuthButton.tsx` | ✅ | ⬜ pending |
| 04-03-01 | 03 | 2 | UX-04 | unit | `npm run test:run -- TransferBottomBar` | ✅ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | UX-04 | unit | `npm run test:run -- PlaylistList` | ✅ | ⬜ pending |
| 04-03-03 | 03 | 2 | UX-04,06 | build | `npm run build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Light theme renders correctly | UX-07 | Visual appearance | Inspect UI in browser, verify white bg, clean shadows |
| No hydration error in console | UX-08 | Console inspection | Run `npm run dev`, reload, check for React hydration warnings |
| No DEBUG logs in console | UX-09 | Console inspection | Run transfer flow, verify no [DEBUG] messages |
| Mobile layout responsive | UX-10 | Device viewport | Test on mobile device or responsive mode |
| Batch transfer transfers ALL playlists | UX-04 | E2E flow | Click transfer with 3 playlists, verify all 3 complete |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (04-00-PLAN.md created)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready for execution
