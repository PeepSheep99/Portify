# Roadmap: Portify MVP

## Overview

Minimal viable product: Spotify GDPR JSON export -> YouTube Music playlists. Two phases, ship fast.

## Phases

- [x] **Phase 1: Foundation + Spotify Parser** — Vercel setup, JSON parsing, file upload UI
- [x] **Phase 2: YouTube Music + Transfer** — OAuth, matching, playlist creation, progress UI (completed 2026-03-13)
- [x] **Phase 3: UI Polish & UX Refinements** — Icons, progress bar, dropzone visibility, playlist selection (completed 2026-03-14)
- [x] **Phase 4: UX Overhaul & Visual Refresh** — Interaction fixes, visual redesign, mobile optimization (completed 2026-03-14)

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
- [x] 02-00-PLAN.md — Wave 0: Test infrastructure + skeleton tests (all requirements)
- [x] 02-01-PLAN.md — YouTube Music OAuth + ytmusicapi integration (DST-01)
- [x] 02-02-PLAN.md — Track matching with tiered search + fuzzy matching (MTH-01, MTH-02)
- [x] 02-03-PLAN.md — Playlist transfer with SSE progress + results UI (DST-02, DST-03, UX-02, UX-03)

**Success Criteria**:
  1. User can authenticate with YouTube Music
  2. System matches tracks by name + artist
  3. User sees which tracks matched and which didn't
  4. User can create playlist on YouTube Music with matched tracks
  5. User sees progress during transfer
  6. User sees summary of results

### Phase 3: UI Polish & UX Refinements
**Goal**: Polish the UI with icons, improved progress bar, and better UX flows
**Depends on**: Phase 2
**Requirements**: None (polish phase)
**Plans:** 3/3 plans complete

Plans:
- [x] 03-01-PLAN.md — Install Lucide icons, simplify progress bar (remove music theme)
- [x] 03-02-PLAN.md — Dropzone visibility toggle, playlist selection checkboxes
- [x] 03-03-PLAN.md — Fix SSE buffering for real-time progress updates

**Success Criteria**:
  1. Progress bar shows clean circular progress without music visualizer
  2. All icons use Lucide React for consistency
  3. Dropzone hides after upload, can be shown again
  4. User can select/deselect playlists with checkboxes
  5. SSE progress events arrive in real-time (not batched)

### Phase 4: UX Overhaul & Visual Refresh
**Goal:** Transform to clean light theme, simplify transfer interaction, improve OAuth UX, optimize mobile
**Depends on:** Phase 3
**Requirements**: UX-04, UX-05, UX-06, UX-07, UX-08, UX-09, UX-10, UX-11
**Plans:** 4/4 plans complete

Plans:
- [x] 04-00-PLAN.md — Wave 0: Test scaffolds for TDD implementation (Nyquist compliance)
- [x] 04-01-PLAN.md — Light theme CSS + bug fixes (hydration, debug logs, dead code cleanup)
- [x] 04-02-PLAN.md — OAuth UX improvements (copy toast feedback, auto-open verification URL)
- [ ] 04-03-PLAN.md — Batch transfer flow + unified progress + mobile optimization

**Success Criteria**:
  1. App displays with light theme (white background, Spotify green accent)
  2. No hydration errors or DEBUG logs in console
  3. Clicking copy shows "Copied!" toast
  4. All playlists selected by default (opt-out with x icon)
  5. Single "Transfer X playlists" button in fixed bottom bar
  6. Progress shows unified 0-100% with phase labels
  7. Mobile responsive layout with proper spacing

## Progress

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Foundation + Spotify Parser | 3/3 | Complete |
| 2. YouTube Music + Transfer | 4/4 | Complete |
| 3. UI Polish & UX Refinements | 3/3 | Complete |
| 4. UX Overhaul & Visual Refresh | 3/4 | In Progress |

---
*Roadmap created: 2026-03-13*
*Scope: MVP (Spotify -> YouTube Music only)*
*Requirements: 13 total (UX-04 through UX-11 added in Phase 4)*
