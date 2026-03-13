---
phase: 3
slug: ui-polish-ux-refinements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + Testing Library React 16.3.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test:run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run -- --reporter=dot`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | UI-POLISH | visual | Manual inspection | N/A | ⬜ pending |
| 03-02-01 | 02 | 1 | SSE-FIX | e2e/manual | Network tab inspection | N/A | ⬜ pending |
| 03-03-01 | 03 | 1 | CHECKBOX | unit | `npm run test:run -- Checkbox` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 1 | ICONS | unit | `npm run test:run -- icons` | ❌ W0 | ⬜ pending |
| 03-05-01 | 05 | 1 | PROGRESS | visual | Manual inspection | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/ui/Checkbox.test.tsx` — test checkbox toggle behavior
- [ ] Update existing component tests to cover new visibility/selection props
- [ ] No new test infrastructure needed — existing Vitest setup sufficient

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dropzone hides with animation | UI-POLISH | Animation timing is visual | 1. Upload file 2. Verify dropzone fades out smoothly |
| Progress bar animates correctly | PROGRESS | Visual animation quality | 1. Start transfer 2. Watch for smooth progress updates |
| SSE streaming works real-time | SSE-FIX | Requires network inspection | 1. Open DevTools Network 2. Start transfer 3. Verify events arrive incrementally |
| Icons render at correct size | ICONS | Visual inspection | 1. Navigate app 2. Check all icons display consistently |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
