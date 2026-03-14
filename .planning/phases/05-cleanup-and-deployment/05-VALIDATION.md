---
phase: 5
slug: cleanup-and-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (Frontend)** | Vitest 4.1.0 |
| **Framework (Backend)** | Pytest 8.0.0 |
| **Config file (Frontend)** | vitest.config.mts |
| **Config file (Backend)** | pytest.ini (implicit) |
| **Quick run command** | `npm run lint && npm run test:run` |
| **Full suite command** | `npm run lint && npm run test:run && npm run build` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint && npm run test:run`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | None | lint | `npm run lint` | N/A | pending |
| 05-01-02 | 01 | 1 | None | lint | `npm run lint` | N/A | pending |
| 05-02-01 | 02 | 1 | None | unit | `npm run test:run` | FileDropzone.test.tsx | pending |
| 05-02-02 | 02 | 1 | None | unit | `npm run test:run` | TransferResults.test.tsx | pending |
| 05-03-01 | 03 | 1 | None | lint | `npm run lint` | N/A | pending |
| 05-04-01 | 04 | 2 | None | e2e | `npm run build` | N/A | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [x] Vitest test infrastructure exists (vitest.config.mts)
- [x] Pytest test infrastructure exists (api/tests/)
- [x] ESLint configured (eslint.config.mjs)
- [ ] No additional Wave 0 setup needed

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Production deployment works | Success Criteria 5 | Requires Vercel dashboard, live env | Deploy via Vercel CLI or dashboard, test upload -> auth -> transfer flow |
| Environment variables set | Success Criteria 4 | Vercel dashboard configuration | Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Production scope |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
