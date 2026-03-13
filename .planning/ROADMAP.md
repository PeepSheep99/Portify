# Roadmap: PlaylistCopier

## Overview

PlaylistCopier delivers playlist migration across Spotify (via GDPR export), Apple Music, and YouTube Music. The roadmap moves from infrastructure (foundation, deployment) through data sources (Spotify JSON, Apple Music, YouTube Music), core logic (track matching), user experience (transfer feedback), and final polish (UI refinement). Each phase delivers a coherent capability that builds toward the core value: preserving music curation when switching platforms.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Project scaffold, deployment infrastructure, client-side processing foundation
- [ ] **Phase 2: Spotify Import** - Parse Spotify GDPR JSON exports for playlists and liked songs
- [ ] **Phase 3: Apple Music Integration** - OAuth authentication, read/write playlists and liked songs
- [ ] **Phase 4: YouTube Music Integration** - Authentication, read/write playlists and liked songs via Python serverless
- [ ] **Phase 5: Track Matching Engine** - ISRC and fuzzy matching with confidence scoring
- [ ] **Phase 6: Transfer Experience** - Progress indication, results summary, duplicate detection
- [ ] **Phase 7: UI Polish** - Landing page, wizard flow, visual refinements, responsive design

## Phase Details

### Phase 1: Foundation
**Goal**: Users can access a deployed web application with the infrastructure to process data client-side
**Depends on**: Nothing (first phase)
**Requirements**: DEP-01, DEP-02, DEP-03, DEP-04, PLT-01
**Success Criteria** (what must be TRUE):
  1. User can access the application at a Vercel URL in Chrome, Firefox, Safari, or Edge
  2. Python serverless function endpoint responds successfully when called
  3. Application processes sample data entirely in the browser (no server storage)
  4. No user data persists on the server after a session ends
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD
- [ ] 01-03: TBD

### Phase 2: Spotify Import
**Goal**: Users can extract their playlists and liked songs from Spotify GDPR export files
**Depends on**: Phase 1
**Requirements**: SRC-01, SRC-02, SRC-03, UX-03
**Success Criteria** (what must be TRUE):
  1. User can drag and drop a Spotify GDPR JSON file onto the application
  2. User sees a list of parsed playlists with track names and artists
  3. User sees their parsed liked songs as a separate collection
  4. Application handles malformed or unexpected JSON gracefully with clear error message
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Apple Music Integration
**Goal**: Users can connect Apple Music and transfer playlists/liked songs to and from the service
**Depends on**: Phase 2
**Requirements**: SRC-04, SRC-05, SRC-06, DST-01, DST-02, PLT-02
**Success Criteria** (what must be TRUE):
  1. User can authenticate with Apple Music via OAuth and see their account connected
  2. User can browse and select playlists from their Apple Music library
  3. User can browse and select liked songs from their Apple Music library
  4. User can create a new playlist on Apple Music from imported tracks
  5. User can add tracks to their Apple Music library (liked songs)
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: YouTube Music Integration
**Goal**: Users can connect YouTube Music and transfer playlists/liked songs to and from the service
**Depends on**: Phase 3
**Requirements**: SRC-07, SRC-08, SRC-09, DST-03, DST-04, PLT-03
**Success Criteria** (what must be TRUE):
  1. User can authenticate with YouTube Music and see their account connected
  2. User can browse and select playlists from their YouTube Music library
  3. User can browse and select liked songs from their YouTube Music library
  4. User can create a new playlist on YouTube Music from imported tracks
  5. User can add tracks to their YouTube Music library (liked songs)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Track Matching Engine
**Goal**: System accurately matches tracks between platforms using ISRC codes and fuzzy text matching
**Depends on**: Phase 4
**Requirements**: MTH-01, MTH-02, MTH-03, MTH-04
**Success Criteria** (what must be TRUE):
  1. System matches tracks by name and artist when ISRC is unavailable
  2. System uses ISRC codes for matching when available (higher accuracy)
  3. User sees a confidence score (high/medium/low) for each matched track
  4. Transfer proceeds successfully even when some tracks cannot be matched
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Transfer Experience
**Goal**: Users have clear visibility into transfer progress and results
**Depends on**: Phase 5
**Requirements**: TXP-01, TXP-02, TXP-03, TXP-04
**Success Criteria** (what must be TRUE):
  1. User sees a progress indicator showing transfer status during operation
  2. User sees a summary screen showing matched, unmatched, and duplicate counts
  3. User can download a list of unmatched tracks as a file
  4. System automatically skips tracks already present in the destination
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: UI Polish
**Goal**: Application has a polished, professional user interface with excellent UX
**Depends on**: Phase 6
**Requirements**: UX-01, UX-02, UX-04, UX-05, UX-06, UX-07, UX-08, UX-09
**Success Criteria** (what must be TRUE):
  1. Landing page clearly explains what the app does and how to get started
  2. User experiences a step-by-step wizard flow (source, match, destination, confirm)
  3. Playlists display as visual cards with album art and track count
  4. Transfer shows animated progress with per-track status updates
  5. Successful transfer shows celebratory state with shareable stats
  6. Error states provide clear messages with actionable recovery steps
  7. Application works correctly on mobile browsers (responsive)
  8. User can toggle dark mode
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD
- [ ] 07-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Spotify Import | 0/2 | Not started | - |
| 3. Apple Music Integration | 0/3 | Not started | - |
| 4. YouTube Music Integration | 0/3 | Not started | - |
| 5. Track Matching Engine | 0/2 | Not started | - |
| 6. Transfer Experience | 0/2 | Not started | - |
| 7. UI Polish | 0/3 | Not started | - |

---
*Roadmap created: 2026-03-13*
*Granularity: standard (7 phases)*
*Requirements coverage: 37/37 mapped*
