# Requirements: Portify MVP

**Defined:** 2026-03-13
**Core Value:** Users can move their Spotify playlists to YouTube Music without manually recreating them.

## v1 Requirements (MVP)

### Spotify Import

- [x] **SRC-01**: User can upload Spotify GDPR JSON export file
- [x] **SRC-02**: User can see parsed playlists with track names
- [x] **SRC-03**: User can see parsed liked songs

### YouTube Music Export

- [x] **DST-01**: User can connect YouTube Music account
- [x] **DST-02**: User can create playlist on YouTube Music
- [x] **DST-03**: User can add songs to YouTube Music library

### Track Matching

- [x] **MTH-01**: System matches tracks by name + artist
- [x] **MTH-02**: System shows which tracks matched/unmatched

### User Experience

- [x] **UX-01**: User can drag-and-drop JSON file
- [x] **UX-02**: User sees progress during transfer
- [x] **UX-03**: User sees summary of results
- [x] **UX-04**: User can transfer all playlists in batch (opt-out selection model)
- [x] **UX-05**: User gets toast feedback on copy and auto-opens verification URL
- [x] **UX-06**: User sees unified 0-100% progress that never resets
- [x] **UX-07**: App displays with light theme (white background, green accents)
- [x] **UX-08**: No hydration errors on page load
- [x] **UX-09**: No debug logs visible in browser console
- [x] **UX-10**: App is responsive on mobile devices
- [x] **UX-11**: No dead code exports or unused components

### Deployment

- [x] **DEP-01**: App hosted on Vercel (free tier)
- [x] **DEP-02**: YouTube Music calls via Python serverless

## v2 Requirements (Future)

- YouTube Music → Spotify (bidirectional)
- Apple Music support
- ISRC-based matching
- Polished UI, dark mode
- Confidence scores

## Out of Scope

| Feature | Reason |
|---------|--------|
| Apple Music | Adds extension complexity |
| Spotify API | ToS prohibits; using JSON export |
| Bidirectional | MVP is one-way only |
| Polished UI | Functional > beautiful for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEP-01 | Phase 1 | Complete |
| DEP-02 | Phase 1 | Complete |
| SRC-01 | Phase 1 | Complete |
| SRC-02 | Phase 1 | Complete |
| SRC-03 | Phase 1 | Complete |
| UX-01 | Phase 1 | Complete |
| DST-01 | Phase 2 | Complete |
| DST-02 | Phase 2 | Complete |
| DST-03 | Phase 2 | Complete |
| MTH-01 | Phase 2 | Complete |
| MTH-02 | Phase 2 | Complete |
| UX-02 | Phase 2 | Complete |
| UX-03 | Phase 2 | Complete |
| UX-04 | Phase 4 | Complete |
| UX-05 | Phase 4 | Complete |
| UX-06 | Phase 4 | Complete |
| UX-07 | Phase 4 | Complete |
| UX-08 | Phase 4 | Complete |
| UX-09 | Phase 4 | Complete |
| UX-10 | Phase 4 | Complete |
| UX-11 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-03-13 (MVP scope)*
