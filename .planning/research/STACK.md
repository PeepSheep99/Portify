# Technology Stack: Playlist Migration APIs

**Project:** PlaylistCopier
**Researched:** 2026-03-13
**Overall Confidence:** MEDIUM (significant API changes in Feb 2026 create uncertainty)

## Executive Summary

Building a playlist migration tool in March 2026 requires navigating significant recent API restrictions on Spotify, moderate complexity with Apple Music, and reliance on an unofficial library for YouTube Music. The core challenge is that **Spotify's February 2026 API changes** now require Premium subscriptions for Development Mode and have reduced available endpoints. Cross-platform track matching is possible via ISRC codes, which remain available.

---

## Platform API Analysis

### Spotify Web API

**Status:** Official API available with significant restrictions as of February 2026

#### Authentication

| Requirement | Details |
|------------|---------|
| **Flow** | Authorization Code with PKCE (required for web apps) |
| **Developer Account** | Free to create at developer.spotify.com |
| **Premium Required** | YES - Development Mode requires app owner to have active Spotify Premium |
| **User Limit** | 5 authorized users per Client ID in Development Mode |
| **OAuth Scopes Needed** | `playlist-read-private`, `playlist-read-collaborative`, `playlist-modify-public`, `playlist-modify-private`, `user-library-read` |

#### Available Endpoints for Playlist Migration

| Endpoint | Method | Purpose | Quota Cost |
|----------|--------|---------|------------|
| `GET /me/playlists` | GET | List current user's playlists | Standard |
| `GET /playlists/{id}` | GET | Get playlist details (items only for owned/collaborative) | Standard |
| `GET /playlists/{id}/items` | GET | Get playlist tracks (renamed from /tracks in Feb 2026) | Standard |
| `POST /me/playlists` | POST | Create playlist for current user | Standard |
| `POST /playlists/{id}/items` | POST | Add items to playlist | Standard |
| `GET /me/tracks` | GET | Get user's saved/liked tracks | Standard |
| `PUT /me/library` | PUT | Save items to library (new unified endpoint) | Standard |
| `GET /search` | GET | Search for tracks (limit reduced to max 10 results) | Standard |

#### Removed/Changed Endpoints (February 2026)

- `POST /users/{user_id}/playlists` - REMOVED (use `POST /me/playlists` instead)
- `PUT /playlists/{id}/tracks` - REMOVED (reorder/replace no longer available)
- `GET /users/{id}/playlists` - REMOVED (cannot get other users' playlists)
- `DELETE /me/tracks` - REMOVED
- Search `limit` parameter max reduced from 50 to 10

#### Rate Limits

| Metric | Value |
|--------|-------|
| **Window** | Rolling 30-second window |
| **Exact Limit** | Not publicly disclosed |
| **Response** | HTTP 429 with `Retry-After` header |
| **Mode Impact** | Development Mode has lower limits than Extended Quota Mode |

#### Critical Limitations

1. **Playlist contents only returned for owned/collaborative playlists** - Cannot read other users' playlist tracks
2. **Premium required for Development Mode** - $10.99/month minimum cost
3. **5 user limit in Development Mode** - Cannot scale without Extended Quota Mode
4. **Extended Quota Mode requires 250,000 MAU and registered business** - Effectively unreachable for indie projects
5. **ISRC (`external_ids`) available** - Reverted in March 2026, still works for cross-platform matching

**Confidence:** MEDIUM - Recent changes create implementation risk; endpoints may change again

---

### Apple Music API (MusicKit)

**Status:** Official API available, requires paid Apple Developer account

#### Authentication

| Requirement | Details |
|------------|---------|
| **Developer Account** | $99/year Apple Developer Program membership |
| **Developer Token** | JWT signed with ES256, your private key from Apple Developer portal |
| **User Token** | MusicKit JS authorization popup, no refresh token (expires ~6 months) |
| **Platform** | Web (MusicKit JS), iOS, Android |

#### JWT Developer Token Setup

```javascript
// Required: Team ID, Key ID, Private Key (.p8 file)
const jwt = require('jsonwebtoken');
const token = jwt.sign({}, privateKey, {
  algorithm: "ES256",
  expiresIn: "180d",
  issuer: "TEAM_ID",
  header: { alg: "ES256", kid: "KEY_ID" }
});
```

#### Available Endpoints for Playlist Migration

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /v1/me/library/playlists` | GET | Get user's library playlists |
| `GET /v1/me/library/playlists/{id}/tracks` | GET | Get playlist tracks |
| `POST /v1/me/library/playlists` | POST | Create new library playlist |
| `GET /v1/me/library/songs` | GET | Get all library songs (liked songs) |
| `GET /v1/catalog/{storefront}/search` | GET | Search catalog |
| `GET /v1/catalog/{storefront}/songs` | GET | Get songs by ISRC (up to 25 at once) |

#### ISRC Lookup (Critical for Cross-Platform Matching)

```
GET /v1/catalog/us/songs?filter[isrc]=ISRC1,ISRC2,ISRC3
```

- Up to 25 ISRCs per request
- May return multiple songs per ISRC (different versions)
- Library songs don't include ISRC directly - must use `?include=catalog` relationship

#### Rate Limits

| Metric | Value |
|--------|-------|
| **User requests** | 20 requests/second per user |
| **Hourly limit** | ~3600 requests/hour (rolling) |
| **Header** | `X-Rate-Limit` with `user-hour-rem` field |

#### Known Issues

- **504 errors when adding many tracks** - Playlist creation with >100 tracks can fail randomly
- **Workaround:** Create playlist with ~150 tracks, then batch-add remaining in groups of 150
- **User token expires without refresh mechanism** - Must re-authenticate every ~6 months
- **macOS DELETE returns 401** - Playlist deletion may not work on macOS

#### Critical Limitations

1. **$99/year cost** - Non-negotiable Apple Developer membership
2. **No refresh tokens** - User must re-authorize every ~6 months
3. **MusicKit JS required for web auth** - Cannot do standard OAuth redirect flow
4. **Library songs lack ISRC** - Extra API call needed to get catalog relationship

**Confidence:** MEDIUM - API is stable but has quirks; 504 errors and auth flow are documented pain points

---

### YouTube Music API

**Status:** NO OFFICIAL API - Must use unofficial library (ytmusicapi)

#### The Reality

YouTube Music does **not** have an official public API. The YouTube Data API v3 handles general YouTube content but lacks YouTube Music-specific features like:
- Liked Songs playlist
- Library management
- Music-specific search
- Uploaded music

#### Recommended Solution: ytmusicapi

**Library:** [ytmusicapi](https://github.com/sigma67/ytmusicapi) (Python)
**Version:** 1.11.5 (as of January 2026)
**Status:** Actively maintained, unofficial

#### Authentication Methods

| Method | Persistence | Use Case |
|--------|-------------|----------|
| **OAuth** | Long-lived | Recommended for most operations |
| **Browser headers** | ~2 years | Required for uploads |

##### OAuth Setup
```python
from ytmusicapi import YTMusic, OAuthCredentials

# Requires YouTube Data API OAuth credentials (TVs and Limited Input devices type)
ytmusic = YTMusic('oauth.json', oauth_credentials=OAuthCredentials(
    client_id=client_id,
    client_secret=client_secret
))
```

##### Browser Headers Setup
1. Open YouTube Music in browser, ensure logged in
2. Open DevTools > Network tab
3. Find POST request to `/browse`
4. Copy request headers
5. Run `ytmusicapi.setup(filepath="browser.json", headers_raw="...")`

#### Available Functions for Playlist Migration

| Function | Purpose |
|----------|---------|
| `get_library_playlists()` | List user's playlists |
| `get_playlist(playlistId)` | Get playlist contents |
| `create_playlist(title, description)` | Create new playlist |
| `add_playlist_items(playlistId, videoIds)` | Add songs to playlist |
| `get_liked_songs(limit)` | Get Liked Songs playlist |
| `get_library_songs()` | Get songs in library |
| `search(query)` | Search for songs |

#### Rate Limits

| Metric | Details |
|--------|---------|
| **Official limits** | None (unofficial API) |
| **Practical limits** | Risk of triggering anti-bot detection |
| **Hosting risk** | Higher detection risk on AWS, Vercel, etc. |

#### Critical Limitations

1. **Unofficial = Breakage risk** - YouTube updates can break the library at any time
2. **No ISRC support** - Must match by song title + artist name
3. **Anti-bot detection** - Aggressive requests may flag your account
4. **Account risk** - Using unofficial API may violate ToS
5. **Python only** - Official library is Python; ports exist for PHP, JavaScript

**Confidence:** LOW - Unofficial API creates significant reliability and risk concerns

---

## Cross-Platform Track Matching Strategy

### ISRC-Based Matching (Recommended)

ISRC (International Standard Recording Code) is the music industry's unique identifier for recordings.

| Platform | ISRC Access |
|----------|-------------|
| Spotify | `external_ids.isrc` in track response (confirmed available March 2026) |
| Apple Music | `GET /v1/catalog/{storefront}/songs?filter[isrc]=` |
| YouTube Music | NOT AVAILABLE - must use text search |

### Matching Flow

```
1. Export from Source Platform
   - Get track with ISRC (Spotify, Apple Music)
   - Store: { isrc, title, artist, album }

2. Import to Target Platform
   - If target supports ISRC: Search by ISRC
   - If no ISRC match: Fall back to title + artist search
   - For YouTube Music: Always use title + artist search
```

### Match Quality Expectations

| From -> To | Match Method | Expected Accuracy |
|------------|--------------|-------------------|
| Spotify -> Apple Music | ISRC | 95%+ |
| Apple Music -> Spotify | ISRC | 95%+ |
| Any -> YouTube Music | Text search | 80-90% |
| YouTube Music -> Any | Text search | 80-90% |

---

## Recommended Technology Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Node.js** | 20 LTS | Runtime | Best ecosystem for OAuth flows, web apps |
| **TypeScript** | 5.x | Type safety | Complex API responses benefit from types |
| **Express** or **Fastify** | Latest | Web server | Handle OAuth callbacks |

### API Client Libraries

| Library | Platform | Notes |
|---------|----------|-------|
| **spotify-web-api-node** | Spotify | Well-maintained, TypeScript types available |
| **Custom (fetch)** | Apple Music | No dominant library; JWT + fetch is straightforward |
| **ytmusicapi** (Python) | YouTube Music | Must run Python subprocess or use unofficial JS port |

### Alternative: ytmusicapi JavaScript Port

| Library | Status |
|---------|--------|
| [codyduong/ytmusicapiJS](https://github.com/codyduong/ytmusicapiJS) | Active, TypeScript |

### Database (for track matching cache)

| Technology | Purpose | Why |
|------------|---------|-----|
| **SQLite** | Local storage | Simple, no server needed, portable |
| **PostgreSQL** | Production | If scaling beyond single user |

---

## What's NOT Possible via Official APIs

| Limitation | Platform | Impact |
|------------|----------|--------|
| Access other users' playlist contents | Spotify | Can only migrate YOUR playlists |
| Automatic token refresh | Apple Music | User must re-auth every 6 months |
| Official YouTube Music access | YouTube Music | Must use unofficial library |
| Guaranteed track matching | All | Some songs won't exist on target platform |
| High volume operations | Spotify (Dev Mode) | 5 user limit blocks scaling |
| ISRC lookup | YouTube Music | Must use text matching |

---

## Cost Analysis

| Item | Cost | Required |
|------|------|----------|
| Spotify Developer Account | Free | Yes |
| Spotify Premium (for dev) | $10.99/month | Yes (since Feb 2026) |
| Apple Developer Membership | $99/year | Yes |
| Google Cloud (YouTube API) | Free tier sufficient | Yes for OAuth |
| **Total Minimum** | **~$230/year** | - |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Spotify API further restrictions | HIGH | Build abstraction layer, consider Extended Quota Mode path |
| ytmusicapi breaks | HIGH | Pin version, monitor GitHub issues, have fallback |
| Apple Music auth complexity | MEDIUM | Use MusicKit JS, document re-auth flow |
| Track match failures | MEDIUM | Store unmatched tracks for manual review |
| Rate limit hits | LOW | Implement exponential backoff, respect Retry-After |

---

## Sources

### Spotify
- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [February 2026 Changelog](https://developer.spotify.com/documentation/web-api/references/changes/february-2026)
- [March 2026 Changelog](https://developer.spotify.com/documentation/web-api/references/changes/march-2026)
- [Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)
- [OAuth Scopes](https://developer.spotify.com/documentation/web-api/concepts/scopes)
- [Authorization Code with PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
- [Quota Modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)

### Apple Music
- [Apple Music API Documentation](https://developer.apple.com/documentation/applemusicapi/)
- [MusicKit on the Web](https://js-cdn.music.apple.com/musickit/v3/docs/index.html)
- [Generating Developer Tokens](https://developer.apple.com/documentation/applemusicapi/generating-developer-tokens)
- [User Authentication for MusicKit](https://developer.apple.com/documentation/applemusicapi/user-authentication-for-musickit)
- [Get Multiple Catalog Songs by ISRC](https://developer.apple.com/documentation/applemusicapi/get-multiple-catalog-songs-by-isrc)
- [Create a New Library Playlist](https://developer.apple.com/documentation/applemusicapi/create-a-new-library-playlist)

### YouTube Music
- [ytmusicapi Documentation](https://ytmusicapi.readthedocs.io/)
- [ytmusicapi GitHub](https://github.com/sigma67/ytmusicapi)
- [YouTube Data API v3](https://developers.google.com/youtube/v3/docs)
- [OAuth Authentication Setup](https://ytmusicapi.readthedocs.io/en/stable/setup/oauth.html)

### Cross-Platform Matching
- [How to Match Tracks Between Spotify and Apple Music](https://leemartin.dev/how-to-match-tracks-between-spotify-and-apple-music-2d6b6159957e)
