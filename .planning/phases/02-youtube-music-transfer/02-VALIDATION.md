---
phase: 2
slug: youtube-music-transfer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + pytest |
| **Config file** | `vitest.config.mts`, `pytest.ini` |
| **Quick run command** | `npm run test:run && pytest api/tests/ -x` |
| **Full suite command** | `npm run test:run && pytest api/tests/` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick test for changed module
- **After every plan wave:** Run full suite (`npm run test:run && pytest api/tests/ -x`)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DST-01 | integration | `pytest api/tests/test_oauth.py -x` | Wave 0 | ⬜ pending |
| 02-02-01 | 02 | 2 | MTH-01 | unit | `pytest api/tests/test_track_matcher.py::test_search -x` | Wave 0 | ⬜ pending |
| 02-02-02 | 02 | 2 | MTH-02 | unit | `pytest api/tests/test_track_matcher.py::test_results -x` | Wave 0 | ⬜ pending |
| 02-03-01 | 03 | 3 | DST-02 | integration | `pytest api/tests/test_youtube_music.py::test_create_playlist -x` | Wave 0 | ⬜ pending |
| 02-03-02 | 03 | 3 | DST-03 | integration | `pytest api/tests/test_youtube_music.py::test_add_tracks -x` | Wave 0 | ⬜ pending |
| 02-04-01 | 04 | 4 | UX-02 | integration | `npm run test:run -- TransferProgress` | Wave 0 | ⬜ pending |
| 02-04-02 | 04 | 4 | UX-03 | unit | `npm run test:run -- TransferResults` | Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `api/tests/test_oauth.py` — OAuth flow tests with mocked Google responses
- [ ] `api/tests/test_youtube_music.py` — ytmusicapi wrapper tests
- [ ] `api/tests/test_track_matcher.py` — Track matching logic tests
- [ ] `src/components/TransferProgress.test.tsx` — SSE progress display tests
- [ ] `src/components/TransferResults.test.tsx` — Summary display tests
- [ ] `api/tests/conftest.py` — pytest fixtures for ytmusicapi mocking
- [ ] pytest install: `pip install pytest pytest-asyncio`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OAuth flow with real Google account | DST-01 | Requires real Google auth interaction | 1. Click "Connect YouTube Music" 2. Complete Google sign-in 3. Verify token received |
| Real playlist creation on YouTube Music | DST-02, DST-03 | Requires real YTM account with quota | 1. Upload test Spotify JSON 2. Click "Transfer" 3. Verify playlist appears in YouTube Music app |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
