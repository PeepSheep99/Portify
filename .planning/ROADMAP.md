# Roadmap: Portify MVP

## Overview

Minimal viable product: Spotify GDPR JSON export -> YouTube Music playlists. Two phases, ship fast.

## Phases

- [x] **Phase 1: Foundation + Spotify Parser** — Vercel setup, JSON parsing, file upload UI
- [ ] **Phase 2: YouTube Music + Transfer** — OAuth, matching, playlist creation, progress UI

## Phase Details

### Phase 1: Foundation + Spotify Parser
**Goal**: User can upload Spotify JSON and see their playlists
**Depends on**: Nothing
**Requirements**: DEP-01, DEP-02, SRC-01, SRC-02, SRC-03, UX-01
**Plans:** 3/3 plans executed

Plans:
- [x] 01-01-PLAN.md — Vercel project setup + Python serverless + test infrastructure
- [x] 01-02-PLAN.md — Spotify JSON parser with TDD (playlists + liked songs)
- [x] 01-03-PLAN.md — File upload UI with drag-and-drop + playlist display

**Success Criteria**:
  1. App deploys to Vercel and loads in browser
  2. Python serverless function responds (health check)
  3. User can drag-and-drop Spotify JSON file
  4. User sees list of playlists with track names
  5. User sees liked songs as separate list

### Phase 2: YouTube Music + Transfer
**Goal**: User can transfer playlists from Spotify to YouTube Music
**Depends on**: Phase 1
**Requirements**: DST-01, DST-02, DST-03, MTH-01, MTH-02, UX-02, UX-03
**Plans:** 4 plans

Plans:
- [ ] 02-00-PLAN.md — Wave 0: Test infrastructure + skeleton tests (all requirements)
- [ ] 02-01-PLAN.md — YouTube Music OAuth + ytmusicapi integration (DST-01)
- [ ] 02-02-PLAN.md — Track matching with tiered search + fuzzy matching (MTH-01, MTH-02)
- [ ] 02-03-PLAN.md — Playlist transfer with SSE progress + results UI (DST-02, DST-03, UX-02, UX-03)

**Success Criteria**:
  1. User can authenticate with YouTube Music
  2. System matches tracks by name + artist
  3. User sees which tracks matched and which didn't
  4. User can create playlist on YouTube Music with matched tracks
  5. User sees progress during transfer
  6. User sees summary of results

## Progress

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Foundation + Spotify Parser | 3/3 | Complete |
| 2. YouTube Music + Transfer | 0/4 | Ready |

---
*Roadmap created: 2026-03-13*
*Scope: MVP (Spotify -> YouTube Music only)*
*Requirements: 13 total*
