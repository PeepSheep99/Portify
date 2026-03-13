---
phase: 3
slug: ui-polish-ux-refinements
status: draft
nyquist_compliant: true
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
| 03-01-01 | 01 | 1 | ICONS+PROGRESS | build+unit | `npm run build && npm run test:run -- --reporter=dot` | N/A | pending |
| 03-02-01 | 02 | 2 | CHECKBOX | unit | `npx tsc --noEmit && npm run test:run -- Checkbox` | W0 | pending |
| 03-02-02 | 02 | 2 | DROPZONE+SELECT | build+unit | `npm run build && npm run test:run -- --reporter=dot` | N/A | pending |
| 03-03-01 | 03 | 1 | SSE-FIX | import+grep | `python -c "from index import transfer_stream_generator" && grep -q "Content-Encoding" api/transfer.py && grep -q "flush\|sleep" api/index.py` | N/A | pending |
| 03-03-02 | 03 | 1 | SSE-FIX | manual | Network tab inspection | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/components/ui/Checkbox.test.tsx` — test checkbox toggle, animation, disabled state (created in Plan 03-02 Task 1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dropzone hides with animation | UI-POLISH | Animation timing is visual | 1. Upload file 2. Verify dropzone fades out smoothly |
| Progress bar animates correctly | PROGRESS | Visual animation quality | 1. Start transfer 2. Watch for smooth progress updates |
| SSE streaming works real-time | SSE-FIX | Requires network inspection | 1. Open DevTools Network 2. Start transfer 3. Verify events arrive incrementally |
| Icons render at correct size | ICONS | Visual inspection | 1. Navigate app 2. Check all icons display consistently |
| Add more files button shows dropzone | UI-POLISH | Interactive behavior | 1. Upload file 2. Click "Add more files" 3. Verify dropzone reappears |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready for execution
