# Phase 6: YouTube Music to Spotify Transfer - Research

**Researched:** 2026-03-15
**Domain:** Reverse playlist transfer (YouTube Music source, Spotify destination)
**Confidence:** HIGH

## Summary

Phase 6 enables bidirectional transfer by implementing the reverse flow: reading playlists from YouTube Music and creating them on Spotify. This builds on the existing Phase 2 infrastructure, reusing the ytmusicapi library for reading YouTube Music playlists and adding a new Spotify Web API OAuth PKCE integration for writing to Spotify.

The primary architectural challenge is that the existing YouTube Music OAuth uses the TV/Limited Input device flow (which works for both reading and writing to YouTube), while Spotify requires Authorization Code with PKCE flow for browser-based apps. This means adding a second OAuth flow optimized for Spotify's requirements.

**Primary recommendation:** Reuse the existing track matching pattern (60% title / 40% artist weighting with fuzzy matching) but reverse the direction - search Spotify's catalog for YouTube Music tracks using the Spotify Search API.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REV-01 | User can read playlists from YouTube Music account | ytmusicapi `get_library_playlists()` + `get_playlist(playlistId)` with existing OAuth token |
| REV-02 | User can connect Spotify account via OAuth | Spotify Authorization Code with PKCE flow - browser redirect-based |
| REV-03 | System matches YouTube Music tracks to Spotify catalog | Spotify Search API `GET /search?type=track` with existing fuzzy matching logic |
| REV-04 | User can create Spotify playlists with matched tracks | `POST /me/playlists` + `POST /playlists/{id}/items` endpoints |
| REV-05 | User sees progress during reverse transfer | Reuse existing SSE streaming pattern from transfer.py |
| REV-06 | User sees summary of reverse transfer results | Reuse existing TransferResults component with minor label changes |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ytmusicapi | 1.11.5 | Read YouTube Music playlists | Already in use, provides `get_library_playlists()` and `get_playlist()` |
| requests | 2.31+ | Spotify API HTTP calls | Already in use for YouTube Data API calls |
| rapidfuzz | 3.0+ | Fuzzy string matching | Already in use for track matching |
| unidecode | 1.3+ | String normalization | Already in use for track matching |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto-js | 4.2+ | PKCE code challenge generation | Frontend PKCE flow (or use Web Crypto API) |
| N/A (Web Crypto API) | native | SHA-256 hash for PKCE | Browser-native, no dependency needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct Spotify API | spotipy library | Adds dependency; direct requests simpler for our limited endpoint usage |
| PKCE in frontend | Device code flow | Device flow requires user to copy code; PKCE is seamless redirect |
| New OAuth component | Extend YouTubeAuthButton | Different UX (redirect vs device code); separate component cleaner |

**Installation:**
```bash
# No new Python dependencies needed - all already installed
# Frontend: No new npm dependencies needed - Web Crypto API is native
```

## Architecture Patterns

### Recommended Project Structure
```
api/
  spotify_auth.py       # Spotify OAuth PKCE token exchange
  spotify_api.py        # Spotify playlist/track API calls
  reverse_transfer.py   # YT Music -> Spotify transfer endpoint
  track_matcher.py      # (existing) Add search_spotify_track function

src/
  components/
    SpotifyAuthButton.tsx     # PKCE OAuth flow UI
    ReverseTransferFlow.tsx   # Mode selector UI (optional)
  lib/
    spotifyApi.ts             # Spotify auth + API client
  types/
    spotify.ts                # (existing) Add Spotify API types
```

### Pattern 1: Spotify OAuth with PKCE (Frontend-Initiated)

**What:** Authorization Code with PKCE flow for Spotify - browser redirects to Spotify, user approves, redirects back with code, frontend exchanges code for token via backend.

**When to use:** Always for Spotify OAuth in browser apps (required since Nov 2025).

**Why:** Implicit grant removed Nov 2025. PKCE is secure without client_secret exposure.

**Flow:**
```typescript
// 1. Generate PKCE challenge (frontend)
const verifier = generateCodeVerifier(); // 43-128 chars random
const challenge = await sha256(verifier); // base64url encoded

// 2. Redirect to Spotify auth
const authUrl = new URL('https://accounts.spotify.com/authorize');
authUrl.searchParams.set('client_id', SPOTIFY_CLIENT_ID);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('code_challenge_method', 'S256');
authUrl.searchParams.set('code_challenge', challenge);
authUrl.searchParams.set('scope', 'playlist-modify-public playlist-modify-private');
window.location.href = authUrl.toString();

// 3. After redirect, exchange code for token (via backend to protect client_secret)
const token = await fetch('/api/spotify/auth/callback', {
  method: 'POST',
  body: JSON.stringify({ code, code_verifier: verifier })
});
```

### Pattern 2: Reuse Track Matching with Reversed Direction

**What:** Same 60/40 title/artist weighting and tiered search, but query Spotify instead of YouTube Music.

**When to use:** REV-03 implementation.

**Example:**
```python
# api/track_matcher.py - Add new function
def search_spotify_track(
    access_token: str,
    track_name: str,
    artist_name: str,
    min_confidence: float = 70
) -> Optional[dict]:
    """Search Spotify for a track using tiered search."""

    # Tier 1: Search "artist:X track:Y"
    query = f"artist:{artist_name} track:{track_name}"
    results = spotify_search(access_token, query, type='track', limit=5)

    best_match = find_best_match_spotify(results, track_name, artist_name, min_confidence)
    if best_match:
        return best_match

    # Tier 2: Title-only search
    results = spotify_search(access_token, track_name, type='track', limit=10)
    return find_best_match_spotify(results, track_name, artist_name, min_confidence)
```

### Pattern 3: SSE Progress Streaming (Existing Pattern)

**What:** Server-Sent Events for real-time progress during transfer.

**When to use:** REV-05 implementation - reuse exactly as in Phase 2.

**Example:**
```python
# Same pattern as api/index.py transfer_stream_generator
def reverse_transfer_stream_generator(request):
    for i, track in enumerate(tracks):
        yield f"data: {json.dumps({'phase': 'matching', 'current': i+1, 'total': total})}\n\n"
        # Match track...

    yield f"data: {json.dumps({'phase': 'creating', 'current': 0, 'total': 0})}\n\n"
    # Create playlist...

    for i, uri in enumerate(track_uris):
        yield f"data: {json.dumps({'phase': 'adding', 'current': i+1, 'total': len(track_uris)})}\n\n"
        # Add track...

    yield f"data: {json.dumps({'status': 'complete', 'result': result})}\n\n"
```

### Anti-Patterns to Avoid

- **Storing Spotify client_secret in frontend:** PKCE eliminates this need; token exchange must happen on backend.
- **Using removed Spotify endpoints:** POST /users/{id}/playlists removed Feb 2026 - use POST /me/playlists.
- **Using /tracks instead of /items:** Endpoint renamed - use /playlists/{id}/items.
- **Exceeding 100 items per add request:** Spotify limits to 100 URIs per request; batch in chunks.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PKCE code verifier/challenge | Custom random + hash | Web Crypto API | Secure, standardized, no dependencies |
| Fuzzy string matching | Custom Levenshtein | rapidfuzz (existing) | Optimized C implementation |
| OAuth token refresh | Manual refresh logic | Store refresh_token, call token endpoint | Standard OAuth pattern |
| Rate limit handling | Custom retry logic | Exponential backoff with 429 detection | Already pattern in project |

**Key insight:** The existing track_matcher.py `calculate_confidence` and `normalize_string` functions can be reused directly - only the search source changes from ytmusicapi to Spotify API.

## Common Pitfalls

### Pitfall 1: Spotify Search Limit Change (Feb 2026)

**What goes wrong:** Search returns only 5 results by default, max 10 per request.
**Why it happens:** Feb 2026 API changes reduced limits from 50/20 to 10/5.
**How to avoid:** Set `limit=10` explicitly. If need more results, paginate with `offset`.
**Warning signs:** Poor match rates despite tracks existing on Spotify.

### Pitfall 2: Playlist Endpoint Migration

**What goes wrong:** 404 errors when creating playlists or adding tracks.
**Why it happens:** Feb 2026 removed old endpoints, renamed /tracks to /items.
**How to avoid:** Use `POST /me/playlists` and `POST /playlists/{id}/items`.
**Warning signs:** API returns 404 Not Found for playlist operations.

### Pitfall 3: Scope Requirements for Private Playlists

**What goes wrong:** 403 Forbidden when creating private playlists.
**Why it happens:** Creating playlist with `public: false` requires `playlist-modify-private` scope.
**How to avoid:** Request both `playlist-modify-public` AND `playlist-modify-private` scopes.
**Warning signs:** Public playlists work, private playlists fail.

### Pitfall 4: ytmusicapi OAuth Token Incompatibility

**What goes wrong:** Can't read user's YouTube Music playlists with existing token.
**Why it happens:** YouTube Data API token vs ytmusicapi internal API token.
**How to avoid:** Use `get_library_playlists()` with properly authenticated YTMusic instance.
**Warning signs:** Search works but library access fails.

### Pitfall 5: PKCE Verifier Storage Across Redirect

**What goes wrong:** Token exchange fails with "invalid_grant" error.
**Why it happens:** Code verifier lost during redirect to Spotify and back.
**How to avoid:** Store verifier in sessionStorage before redirect, retrieve after callback.
**Warning signs:** Auth flow works up to redirect, fails on token exchange.

### Pitfall 6: 100-Item Batch Limit

**What goes wrong:** Large playlists fail to fully populate.
**Why it happens:** Spotify limits `POST /playlists/{id}/items` to 100 URIs per request.
**How to avoid:** Batch track URIs in chunks of 100, send multiple requests.
**Warning signs:** Playlists with >100 tracks have exactly 100 tracks after transfer.

## Code Examples

### Spotify PKCE Code Verifier Generation (Frontend)
```typescript
// Source: Spotify Authorization Code with PKCE documentation
function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
```

### Spotify Token Exchange (Backend)
```python
# Source: Spotify OAuth documentation
def exchange_code_for_token(code: str, code_verifier: str, redirect_uri: str) -> dict:
    """Exchange authorization code for access token."""
    response = requests.post(
        'https://accounts.spotify.com/api/token',
        data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
            'client_id': os.environ['SPOTIFY_CLIENT_ID'],
            'code_verifier': code_verifier
        },
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    response.raise_for_status()
    return response.json()  # {access_token, token_type, scope, expires_in, refresh_token}
```

### Spotify Search API
```python
# Source: Spotify Web API documentation
def spotify_search(access_token: str, query: str, type: str = 'track', limit: int = 10) -> list:
    """Search Spotify catalog."""
    response = requests.get(
        'https://api.spotify.com/v1/search',
        params={'q': query, 'type': type, 'limit': limit},
        headers={'Authorization': f'Bearer {access_token}'}
    )
    response.raise_for_status()
    data = response.json()
    return data.get('tracks', {}).get('items', [])
```

### Spotify Create Playlist + Add Tracks
```python
# Source: Spotify Web API documentation (Feb 2026 updated endpoints)
def create_spotify_playlist(access_token: str, name: str, public: bool = False) -> str:
    """Create a new playlist for the current user."""
    response = requests.post(
        'https://api.spotify.com/v1/me/playlists',
        json={'name': name, 'public': public, 'description': 'Imported from YouTube Music via Portify'},
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
    )
    response.raise_for_status()
    return response.json()['id']

def add_tracks_to_spotify_playlist(access_token: str, playlist_id: str, track_uris: list) -> int:
    """Add tracks to a Spotify playlist. Batches in chunks of 100."""
    added = 0
    for i in range(0, len(track_uris), 100):
        batch = track_uris[i:i+100]
        response = requests.post(
            f'https://api.spotify.com/v1/playlists/{playlist_id}/items',
            json={'uris': batch},
            headers={
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
        )
        if response.ok:
            added += len(batch)
    return added
```

### Reading YouTube Music Playlists
```python
# Source: ytmusicapi documentation
def get_user_playlists(ytmusic) -> list:
    """Get all user's library playlists."""
    playlists = ytmusic.get_library_playlists(limit=100)
    return [{
        'playlistId': p['playlistId'],
        'name': p['title'],
        'trackCount': p.get('count', 0),
        'thumbnails': p.get('thumbnails', [])
    } for p in playlists]

def get_playlist_tracks(ytmusic, playlist_id: str) -> list:
    """Get all tracks from a playlist."""
    playlist = ytmusic.get_playlist(playlist_id, limit=5000)
    return [{
        'name': t['title'],
        'artist': t['artists'][0]['name'] if t.get('artists') else 'Unknown',
        'album': t['album']['name'] if t.get('album') else None,
        'videoId': t['videoId']
    } for t in playlist.get('tracks', []) if t.get('videoId')]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Spotify Implicit Grant | Authorization Code with PKCE | Nov 2025 | Must use PKCE for browser apps |
| POST /users/{id}/playlists | POST /me/playlists | Feb 2026 | Old endpoint removed |
| /playlists/{id}/tracks | /playlists/{id}/items | Feb 2026 | Renamed endpoint |
| Search limit 50 | Search limit 10 | Feb 2026 | Must paginate for more results |
| Dev mode unlimited users | Dev mode 5 users + Premium required | Feb 2026 | Apply for Extended Quota if needed |

**Deprecated/outdated:**
- Spotify Implicit Grant: Removed Nov 2025, use PKCE instead
- POST /users/{user_id}/playlists: Removed Feb 2026, use POST /me/playlists
- Search limit=50: Reduced to max 10, default 5

## Open Questions

1. **YouTube Music Liked Songs Playlist ID**
   - What we know: Regular playlists have normal IDs; liked songs has special ID "LM"
   - What's unclear: Whether we should support transferring liked songs as playlist or mark as "Liked Songs"
   - Recommendation: Support "LM" as special case, name playlist "Liked Songs (from YouTube Music)"

2. **Spotify Premium Requirement**
   - What we know: Dev mode apps require app owner to have Spotify Premium (Feb 2026)
   - What's unclear: Whether this app needs Extended Quota Mode for production use
   - Recommendation: Apply for Extended Quota if deploying publicly, document Premium requirement in README

3. **Token Refresh Strategy**
   - What we know: Both Spotify and YouTube tokens have refresh_tokens
   - What's unclear: Whether to proactively refresh or wait for 401
   - Recommendation: Start with wait-for-401 pattern (existing approach), optimize later if needed

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest 8.x (Python) + vitest 4.1 (TypeScript) |
| Config file | pytest.ini (Python) / vitest.config.ts (TypeScript) |
| Quick run command | `pytest api/tests/ -x -q --tb=short` |
| Full suite command | `npm run test:run && pytest api/tests/` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REV-01 | Read YT Music playlists | unit | `pytest api/tests/test_reverse_transfer.py::test_get_user_playlists -x` | Wave 0 |
| REV-02 | Spotify OAuth PKCE | unit | `pytest api/tests/test_spotify_auth.py -x` | Wave 0 |
| REV-03 | Match YT tracks to Spotify | unit | `pytest api/tests/test_spotify_matcher.py -x` | Wave 0 |
| REV-04 | Create Spotify playlist + add tracks | unit | `pytest api/tests/test_spotify_api.py -x` | Wave 0 |
| REV-05 | Progress during transfer | integration | `pytest api/tests/test_reverse_transfer.py::test_sse_progress -x` | Wave 0 |
| REV-06 | Summary of results | unit | `npm run test:run -- --testPathPattern=ReverseTransferResults` | Wave 0 |

### Sampling Rate

- **Per task commit:** `pytest api/tests/ -x -q --tb=short`
- **Per wave merge:** `npm run test:run && pytest api/tests/`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `api/tests/test_spotify_auth.py` - covers REV-02 (Spotify PKCE token exchange)
- [ ] `api/tests/test_spotify_api.py` - covers REV-04 (playlist creation, track adding)
- [ ] `api/tests/test_spotify_matcher.py` - covers REV-03 (Spotify search, confidence scoring)
- [ ] `api/tests/test_reverse_transfer.py` - covers REV-01, REV-05 (playlist reading, SSE streaming)
- [ ] `src/components/SpotifyAuthButton.test.tsx` - covers REV-02 (frontend OAuth flow)
- [ ] Add Spotify mock fixtures to `api/tests/conftest.py`

## Sources

### Primary (HIGH confidence)

- [Spotify Authorization Code with PKCE Flow](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow) - OAuth implementation details
- [Spotify Scopes Documentation](https://developer.spotify.com/documentation/web-api/concepts/scopes) - Required scopes for playlist modification
- [Spotify Web API February 2026 Changelog](https://developer.spotify.com/documentation/web-api/references/changes/february-2026) - Critical endpoint changes
- [Spotify Create Playlist Reference](https://developer.spotify.com/documentation/web-api/reference/create-playlist) - POST /me/playlists endpoint
- [Spotify Add Items to Playlist Reference](https://developer.spotify.com/documentation/web-api/reference/add-tracks-to-playlist) - POST /playlists/{id}/items endpoint
- [Spotify Rate Limits](https://developer.spotify.com/documentation/web-api/concepts/rate-limits) - Rate limiting behavior
- [ytmusicapi Documentation](https://ytmusicapi.readthedocs.io/en/stable/) - Library reference
- [ytmusicapi Library Reference](https://ytmusicapi.readthedocs.io/en/stable/reference/library.html) - get_library_playlists function
- [ytmusicapi OAuth Setup](https://ytmusicapi.readthedocs.io/en/stable/setup/oauth.html) - TV client authentication

### Secondary (MEDIUM confidence)

- [Spotify OAuth Migration Reminder (Oct 2025)](https://developer.spotify.com/blog/2025-10-14-reminder-oauth-migration-27-nov-2025) - Implicit grant removal
- [Spotify Security Requirements Update (Feb 2025)](https://developer.spotify.com/blog/2025-02-12-increasing-the-security-requirements-for-integrating-with-spotify) - Security changes
- [ytmusicapi GitHub](https://github.com/sigma67/ytmusicapi) - Source code reference

### Tertiary (LOW confidence)

- None - all critical findings verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing libraries, minimal additions
- Architecture: HIGH - Follows established project patterns from Phase 2
- Pitfalls: HIGH - All verified against Feb 2026 Spotify changelog
- Spotify OAuth: HIGH - Official documentation, well-documented PKCE flow
- ytmusicapi playlist reading: MEDIUM - Requires testing authenticated access with existing token

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (30 days - stable APIs)
