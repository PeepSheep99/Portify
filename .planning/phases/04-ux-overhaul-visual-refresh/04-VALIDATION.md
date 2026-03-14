---
phase: 4
slug: ux-overhaul-visual-refresh
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
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

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | UX-07 | visual | Manual inspection | N/A | ⬜ pending |
| 04-01-02 | 01 | 1 | UX-08 | integration | `npm run dev` + console | N/A | ⬜ pending |
| 04-02-01 | 02 | 1 | UX-04 | unit | `npm run test:run -- PlaylistList` | ✅ | ⬜ pending |
| 04-02-02 | 02 | 1 | UX-04 | unit | `npm run test:run -- TransferBottomBar` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | UX-05 | unit | `npm run test:run -- YouTubeAuthButton` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | UX-05 | unit | `npm run test:run -- Toast` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | UX-06 | unit | `npm run test:run -- TransferProgress` | ✅ | ⬜ pending |
| 04-05-01 | 05 | 3 | UX-10 | visual | Manual mobile inspection | N/A | ⬜ pending |
| 04-06-01 | 06 | 1 | UX-09 | manual | `npm run dev` + transfer | N/A | ⬜ pending |
| 04-06-02 | 06 | 1 | UX-11 | unit | Import check in build | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/TransferBottomBar.test.tsx` — tests for new component (UX-04)
- [ ] `src/components/YouTubeAuthButton.test.tsx` — add tests for copy toast behavior (UX-05)
- [ ] `src/components/Toast.test.tsx` — tests for new toast component (UX-05)
- [ ] Update `src/components/TransferProgress.test.tsx` — tests for unified progress calculation (UX-06)

*Existing infrastructure covers: PlaylistList tests (update needed for opt-out model)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Light theme renders correctly | UX-07 | Visual appearance | Inspect UI in browser, verify white bg, clean shadows |
| No hydration error in console | UX-08 | Console inspection | Run `npm run dev`, reload, check for React hydration warnings |
| No DEBUG logs in console | UX-09 | Console inspection | Run transfer flow, verify no [DEBUG] messages |
| Mobile layout responsive | UX-10 | Device viewport | Test on mobile device or responsive mode |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
