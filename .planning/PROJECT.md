# PlaylistCopier

## What This Is

A simple tool that migrates playlists and liked songs from Spotify to YouTube Music. Users upload their Spotify GDPR data export, and the app creates matching playlists on YouTube Music.

## Core Value

Users can move their Spotify playlists to YouTube Music without manually recreating them.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Parse Spotify GDPR JSON export
- [ ] Match tracks on YouTube Music
- [ ] Create playlists on YouTube Music
- [ ] Simple, functional UI

### Out of Scope (v1)

- Apple Music support — adds extension complexity
- YouTube Music → Spotify — adds extension complexity
- ISRC matching — basic matching is good enough
- Polished UI — functional over beautiful
- Dark mode, animations — defer to v2

## Context

**Problem:** Users switching from Spotify to YouTube Music lose their playlists.

**Solution:** Upload Spotify JSON export → Create playlists on YouTube Music

**Why this exists despite TuneMyMusic:**
- Portfolio/learning project
- Unlimited free transfers (TuneMyMusic limits to 500)
- Privacy-first (data stays in browser)

## Constraints

- **Zero cost**: Vercel free tier + ytmusicapi (unofficial)
- **Spotify read**: GDPR JSON export only (no API)
- **YouTube Music write**: ytmusicapi via serverless functions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MVP scope: Spotify → YT Music only | Ship fast, validate, expand later | — Pending |
| Skip Apple Music | Avoids extension complexity | — Pending |
| Skip polished UI | Functional > beautiful for v1 | — Pending |

---
*Last updated: 2026-03-13 — simplified to MVP scope*
