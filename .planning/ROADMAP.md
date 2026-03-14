# Roadmap: Portify MVP

## Overview

Minimal viable product: Spotify GDPR JSON export -> YouTube Music playlists. Two phases, ship fast.

## Phases

- [x] **Phase 1: Foundation + Spotify Parser** — Vercel setup, JSON parsing, file upload UI
- [x] **Phase 2: YouTube Music + Transfer** — OAuth, matching, playlist creation, progress UI (completed 2026-03-13)
- [x] **Phase 3: UI Polish & UX Refinements** — Icons, progress bar, dropzone visibility, playlist selection (completed 2026-03-14)
- [ ] **Phase 4: UX Overhaul & Visual Refresh** — Interaction fixes, visual redesign, mobile optimization

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

## Progress

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Foundation + Spotify Parser | 3/3 | Complete |
| 2. YouTube Music + Transfer | 4/4 | Complete |
| 3. UI Polish & UX Refinements | 3/3 | Complete |
| 4. UX Overhaul & Visual Refresh | 0/? | Not Started |

### Phase 4: UX Overhaul & Visual Refresh

**Goal:** Improve user experience, fix bugs, create inviting visual design, optimize mobile
**Depends on:** Phase 3
**Requirements**: UX-04 through UX-13 (see below)
**Plans:** 0 plans

**User Requirements:**
1. **Remove checkbox/transfer friction** — Current pattern confusing (checkbox + per-playlist Transfer button). Simplify to batch transfer flow with "Transfer Selected" or remove checkboxes entirely
2. **Fix OAuth UX** — Timer shows 30 min (too long), "Enter code at Google" unclear, copy button needs "Copied!" feedback, link to google.com/device needs prominence
3. **Unified progress bar** — Currently resets 0→100 twice (matching, then creating). Show single continuous progress OR clear phase indicators (Step 1/3, 2/3, 3/3)
4. **Visual refresh** — Dark/gloomy vibes → inviting, happy, clean look. Define cohesive color palette. Remove random colors.
5. **Fix hydration error** — AnimatedBackground.tsx uses Math.random() causing SSR mismatch. Generate particles client-side only
6. **Remove debug console logs** — Stop polluting console with [DEBUG transferPlaylist] logs
7. **Mobile optimization** — Elements too large, uninviting. Create best possible mobile experience with proper responsive design
8. **Dead code cleanup** — Remove unused MusicVisualizer export, replace remaining inline SVG icons with Lucide

Plans:
- [ ] TBD (run /gsd:plan-phase 4 to break down)

---
*Roadmap created: 2026-03-13*
*Scope: MVP (Spotify -> YouTube Music only)*
*Requirements: 13 total*
