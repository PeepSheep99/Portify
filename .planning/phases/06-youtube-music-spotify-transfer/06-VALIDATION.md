---
phase: 6
slug: youtube-music-spotify-transfer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x (Python) + vitest 4.1 (TypeScript) |
| **Config file** | pytest.ini / vitest.config.ts |
| **Quick run command** | `pytest api/tests/ -x -q --tb=short` |
| **Full suite command** | `npm run test:run && pytest api/tests/` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest api/tests/ -x -q --tb=short`
- **After every plan wave:** Run `npm run test:run && pytest api/tests/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 0 | REV-02 | unit | `pytest api/tests/test_spotify_auth.py -x` | W0 | pending |
| 06-02-01 | 02 | 1 | REV-02 | unit | `pytest api/tests/test_spotify_auth.py -x` | W0 | pending |
| 06-03-01 | 03 | 2 | REV-01 | unit | `pytest api/tests/test_reverse_transfer.py::test_get_user_playlists -x` | W0 | pending |
| 06-04-01 | 04 | 3 | REV-03 | unit | `pytest api/tests/test_spotify_matcher.py -x` | W0 | pending |
| 06-05-01 | 05 | 4 | REV-04 | unit | `pytest api/tests/test_spotify_api.py -x` | W0 | pending |
| 06-05-02 | 05 | 4 | REV-05 | integration | `pytest api/tests/test_reverse_transfer.py::test_sse_progress -x` | W0 | pending |
| 06-05-03 | 05 | 4 | REV-06 | unit | `npm run test:run -- --testPathPattern=ReverseTransferResults` | W0 | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [ ] `api/tests/test_spotify_auth.py` — stubs for REV-02 (Spotify PKCE token exchange)
- [ ] `api/tests/test_spotify_api.py` — stubs for REV-04 (playlist creation, track adding)
- [ ] `api/tests/test_spotify_matcher.py` — stubs for REV-03 (Spotify search, confidence scoring)
- [ ] `api/tests/test_reverse_transfer.py` — stubs for REV-01, REV-05 (playlist reading, SSE streaming)
- [ ] `src/components/SpotifyAuthButton.test.tsx` — stubs for REV-02 (frontend OAuth flow)
- [ ] `api/tests/conftest.py` — add Spotify mock fixtures

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Spotify OAuth redirect flow | REV-02 | Requires browser interaction with Spotify | 1. Click Connect Spotify 2. Approve in Spotify 3. Verify redirect back with token |
| End-to-end transfer | REV-04, REV-05 | Requires real Spotify account | 1. Select YT Music playlist 2. Transfer 3. Verify playlist appears in Spotify |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
