# PlaylistCopier

## What This Is

A tool that helps users migrate playlists and liked songs between music streaming services. Supports Spotify (via manual data export), Apple Music, and YouTube Music with a focus on accurate track matching and user review before transfer.

## Core Value

Users can preserve their music curation when switching streaming platforms — without losing songs to bad matches.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Import Spotify playlists via GDPR JSON export
- [ ] Import Spotify liked songs via GDPR JSON export
- [ ] Transfer playlists between Apple Music and YouTube Music (bidirectional)
- [ ] Transfer liked songs between Apple Music and YouTube Music (bidirectional)
- [ ] Match review before transfer (show what matched, what didn't)
- [ ] Create playlists on destination platform

### Out of Scope

- Spotify API integration — ToS prohibits export to competitors; using manual export instead
- Real-time sync — one-time transfer only for v1
- Other platforms (Tidal, Deezer, Amazon Music) — defer to v2

## Context

**Problem:** When users switch music streaming services, they lose their curated playlists and liked songs. Existing tools have poor matching accuracy (20-50% wrong matches) and don't let users review before committing.

**Our approach:**
- Spotify: Manual JSON export (GDPR data download) — 100% legal, no API needed
- Apple Music: Official MusicKit API — requires $99/year Apple Developer
- YouTube Music: Unofficial ytmusicapi — no official API exists

**Track matching strategy:**
- Apple Music ↔ YouTube Music: ISRC codes where available (~95% accuracy)
- Spotify JSON: Fuzzy matching on track + artist + album (~85-90% accuracy)

**Key differentiator:** Match review UI — users see and confirm matches before transfer, can manually fix mismatches.

## Constraints

- **Apple Developer Program**: $99/year required for Apple Music API access
- **YouTube Music API**: No official API — must use unofficial ytmusicapi library (breakage risk)
- **Spotify**: No API access — manual JSON export only
- **Matching accuracy**: Fuzzy matching without ISRC will have ~10-15% misses

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Spotify GDPR export instead of API | ToS prohibits API-based export to competitors; SongShift was forced to remove this | — Pending |
| Match review before transfer | Key differentiator; competitors commit blindly with poor accuracy | — Pending |
| Web app form factor | Fastest to validate; OAuth flows work naturally | — Pending |
| Local-first processing | Privacy differentiator; no cloud storage of user data | — Pending |

---
*Last updated: 2025-03-13 after research and feasibility discussion*
