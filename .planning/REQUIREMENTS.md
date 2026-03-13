# Requirements: PlaylistCopier

**Defined:** 2025-03-13
**Core Value:** Users can preserve their music curation when switching streaming platforms — without losing songs to bad matches.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Import Sources

- [ ] **SRC-01**: User can upload Spotify GDPR JSON export file
- [ ] **SRC-02**: User can parse playlists from Spotify JSON
- [ ] **SRC-03**: User can parse liked songs from Spotify JSON
- [ ] **SRC-04**: User can connect Apple Music account via OAuth
- [ ] **SRC-05**: User can read playlists from Apple Music
- [ ] **SRC-06**: User can read liked songs from Apple Music
- [ ] **SRC-07**: User can connect YouTube Music account
- [ ] **SRC-08**: User can read playlists from YouTube Music
- [ ] **SRC-09**: User can read liked songs from YouTube Music

### Export Destinations

- [ ] **DST-01**: User can create playlist on Apple Music
- [ ] **DST-02**: User can add songs to Apple Music library (liked)
- [ ] **DST-03**: User can create playlist on YouTube Music
- [ ] **DST-04**: User can add songs to YouTube Music library (liked)

### Track Matching

- [ ] **MTH-01**: System matches tracks by name + artist
- [ ] **MTH-02**: System uses ISRC codes when available for higher accuracy
- [ ] **MTH-03**: System shows confidence score for each match
- [ ] **MTH-04**: System handles unmatched tracks gracefully (doesn't fail transfer)

### Transfer Experience

- [ ] **TXP-01**: User sees progress indicator during transfer
- [ ] **TXP-02**: User sees summary of transfer results (matched, unmatched, duplicates)
- [ ] **TXP-03**: User can export list of unmatched tracks
- [ ] **TXP-04**: System detects and skips duplicates already in destination

### Platform Support

- [ ] **PLT-01**: App works in modern web browsers (Chrome, Firefox, Safari, Edge)
- [ ] **PLT-02**: App handles OAuth flows for Apple Music
- [ ] **PLT-03**: App handles authentication for YouTube Music

### Deployment

- [ ] **DEP-01**: Frontend hosted on Vercel (free tier)
- [ ] **DEP-02**: YouTube Music API calls via Vercel Python serverless functions
- [ ] **DEP-03**: All data processing happens client-side where possible (privacy)
- [ ] **DEP-04**: No user data stored on server (stateless)

### UI/UX (Differentiator)

- [ ] **UX-01**: Clean, modern landing page that explains what the app does
- [ ] **UX-02**: Step-by-step wizard flow (source → match → destination → confirm)
- [ ] **UX-03**: Drag-and-drop file upload for Spotify JSON
- [ ] **UX-04**: Visual playlist cards showing album art and track count
- [ ] **UX-05**: Animated progress with per-track status during transfer
- [ ] **UX-06**: Celebratory success state with shareable stats ("Migrated 847 songs!")
- [ ] **UX-07**: Clear error states with actionable recovery steps
- [ ] **UX-08**: Responsive design (works on mobile browsers)
- [ ] **UX-09**: Dark mode support

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Match Review

- **REV-01**: User can review matches before transfer
- **REV-02**: User can manually search for unmatched tracks
- **REV-03**: User can override automatic matches

### Advanced Features

- **ADV-01**: User can pause and resume transfer
- **ADV-02**: User can schedule transfers
- **ADV-03**: User can sync playlists (keep in sync over time)

### Additional Platforms

- **EXT-01**: Support Tidal import/export
- **EXT-02**: Support Deezer import/export
- **EXT-03**: Support Amazon Music import/export

## Out of Scope

| Feature | Reason |
|---------|--------|
| Spotify API integration | ToS prohibits export to competitors; using GDPR export instead |
| Real-time sync | Complex; one-time transfer sufficient for v1 |
| Mobile app | Web-first approach; mobile deferred |
| Audio fingerprinting | Expensive at scale; ISRC + fuzzy matching sufficient |
| Playlist collaboration features | Not core to migration use case |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SRC-01 | TBD | Pending |
| SRC-02 | TBD | Pending |
| SRC-03 | TBD | Pending |
| SRC-04 | TBD | Pending |
| SRC-05 | TBD | Pending |
| SRC-06 | TBD | Pending |
| SRC-07 | TBD | Pending |
| SRC-08 | TBD | Pending |
| SRC-09 | TBD | Pending |
| DST-01 | TBD | Pending |
| DST-02 | TBD | Pending |
| DST-03 | TBD | Pending |
| DST-04 | TBD | Pending |
| MTH-01 | TBD | Pending |
| MTH-02 | TBD | Pending |
| MTH-03 | TBD | Pending |
| MTH-04 | TBD | Pending |
| TXP-01 | TBD | Pending |
| TXP-02 | TBD | Pending |
| TXP-03 | TBD | Pending |
| TXP-04 | TBD | Pending |
| PLT-01 | TBD | Pending |
| PLT-02 | TBD | Pending |
| PLT-03 | TBD | Pending |
| DEP-01 | TBD | Pending |
| DEP-02 | TBD | Pending |
| DEP-03 | TBD | Pending |
| DEP-04 | TBD | Pending |
| UX-01 | TBD | Pending |
| UX-02 | TBD | Pending |
| UX-03 | TBD | Pending |
| UX-04 | TBD | Pending |
| UX-05 | TBD | Pending |
| UX-06 | TBD | Pending |
| UX-07 | TBD | Pending |
| UX-08 | TBD | Pending |
| UX-09 | TBD | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 0
- Unmapped: 37 (pending roadmap)

---
*Requirements defined: 2025-03-13*
*Last updated: 2025-03-13 after scoping session*
