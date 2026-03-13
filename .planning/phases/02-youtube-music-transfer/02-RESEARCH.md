# Phase 2: YouTube Music + Transfer - Research

**Researched:** 2026-03-13
**Domain:** YouTube Music API Integration, Track Matching, OAuth Authentication
**Confidence:** MEDIUM

## Summary

Phase 2 implements the core value proposition: transferring Spotify playlists to YouTube Music. This involves three technical domains: (1) OAuth authentication with Google for YouTube Music access via the `ytmusicapi` Python library, (2) track matching using name/artist search with fuzzy string comparison for edge cases, and (3) playlist creation with progress tracking via Server-Sent Events.

The `ytmusicapi` library (v1.11.5) is the de facto standard for YouTube Music automation. It requires Google Cloud Console credentials using the "TVs and Limited Input devices" OAuth flow. The library handles automatic token refresh, search with filters, and playlist management. For track matching, we'll use YouTube Music's built-in search combined with `rapidfuzz` for string normalization and confidence scoring.

**Primary recommendation:** Use ytmusicapi with OAuth device flow, implement tiered search (exact match then fuzzy), and stream progress updates via SSE from the Python serverless function to the React frontend.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DST-01 | User can connect YouTube Music account | ytmusicapi OAuth with device flow; OAuthCredentials class handles token storage/refresh |
| DST-02 | User can create playlist on YouTube Music | ytmusicapi.create_playlist(name, description) returns playlistId |
| DST-03 | User can add songs to YouTube Music library | ytmusicapi.add_playlist_items(playlistId, videoIds, duplicates=True) |
| MTH-01 | System matches tracks by name + artist | ytmusicapi.search(query, filter='songs') + rapidfuzz for normalization |
| MTH-02 | System shows which tracks matched/unmatched | Return match results with confidence scores; maintain unmatched list |
| UX-02 | User sees progress during transfer | Server-Sent Events (SSE) from Python API to React frontend |
| UX-03 | User sees summary of results | Aggregate matched/unmatched counts with track-level details |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ytmusicapi | 1.11.5 | YouTube Music API access | Only maintained library for YouTube Music; used by all playlist transfer tools |
| rapidfuzz | 3.14+ | Fuzzy string matching | 10-100x faster than fuzzywuzzy; MIT licensed; same API |
| FastAPI | existing | Python serverless API | Already in project; handles OAuth callbacks and SSE |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| unidecode | 1.3+ | Unicode normalization | Strip accents/special chars from track names |
| python-dotenv | 1.0+ | Environment variables | Load Google OAuth credentials |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ytmusicapi | youtube-dl | ytmusicapi has higher-level playlist APIs; youtube-dl is for downloading |
| rapidfuzz | fuzzywuzzy | fuzzywuzzy is GPL licensed and 10x slower |
| SSE | WebSockets | SSE is simpler for one-way progress; WebSockets overkill for this use case |

**Installation:**
```bash
pip install ytmusicapi rapidfuzz unidecode
```

## Architecture Patterns

### Recommended Project Structure
```
api/
  index.py              # Existing FastAPI app
  youtube_music.py      # YouTube Music service (OAuth, search, playlist)
  track_matcher.py      # Track matching logic with fuzzy search
  auth/
    oauth_handler.py    # OAuth flow handlers
    token_store.py      # Token storage (encrypted env/file)
src/
  lib/
    youtubeMusic.ts     # Frontend API client
  components/
    YouTubeAuthButton.tsx    # OAuth trigger
    TransferProgress.tsx     # SSE progress display
    TransferResults.tsx      # Match/unmatch summary
  types/
    youtube.ts          # YouTube Music types
    transfer.ts         # Transfer result types
```

### Pattern 1: OAuth Device Flow for Web Apps
**What:** Use Google's "TVs and Limited Input devices" OAuth flow since ytmusicapi requires it
**When to use:** Always for ytmusicapi OAuth authentication
**Example:**
```python
# Source: https://ytmusicapi.readthedocs.io/en/stable/setup/oauth.html
from ytmusicapi import YTMusic, OAuthCredentials
import os

credentials = OAuthCredentials(
    client_id=os.environ['GOOGLE_CLIENT_ID'],
    client_secret=os.environ['GOOGLE_CLIENT_SECRET']
)

# For initial auth (returns device code + URL for user)
from ytmusicapi.auth.oauth import OAuthCredentials, RefreshingToken
token = RefreshingToken.prompt_for_token(credentials, open_browser=False)

# For subsequent requests with stored token
ytmusic = YTMusic(oauth_json_string, oauth_credentials=credentials)
```

### Pattern 2: Tiered Track Search
**What:** Try progressively looser searches to maximize match rate
**When to use:** Every track match attempt
**Example:**
```python
# Source: Industry best practice from TuneLink case study
def search_track(ytmusic, track_name, artist_name):
    # Tier 1: Exact match with both fields
    query = f"{track_name} {artist_name}"
    results = ytmusic.search(query, filter='songs', limit=5)
    if results:
        return find_best_match(results, track_name, artist_name)

    # Tier 2: Track name only (handles artist name variations)
    results = ytmusic.search(track_name, filter='songs', limit=10)
    if results:
        return find_best_match(results, track_name, artist_name)

    # Tier 3: Normalized search (remove special chars, accents)
    normalized_query = normalize_string(f"{track_name} {artist_name}")
    results = ytmusic.search(normalized_query, filter='songs', limit=10)
    return find_best_match(results, track_name, artist_name) if results else None
```

### Pattern 3: Server-Sent Events for Progress
**What:** Stream transfer progress from Python API to React frontend
**When to use:** During playlist transfer (can take minutes for large playlists)
**Example:**
```python
# Source: https://www.pedroalonso.net/blog/sse-nextjs-real-time-notifications/
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio
import json

async def transfer_generator(tracks, ytmusic, playlist_id):
    total = len(tracks)
    for i, track in enumerate(tracks):
        result = match_and_add_track(ytmusic, playlist_id, track)
        yield f"data: {json.dumps({'progress': i+1, 'total': total, 'track': track['name'], 'status': result})}\n\n"
        await asyncio.sleep(0.1)  # Rate limiting
    yield f"data: {json.dumps({'complete': True})}\n\n"

@app.post("/api/transfer")
async def transfer_playlist(request: TransferRequest):
    return StreamingResponse(
        transfer_generator(request.tracks, ytmusic, request.playlist_id),
        media_type="text/event-stream"
    )
```

### Anti-Patterns to Avoid
- **Storing OAuth tokens in localStorage:** Security risk; use httpOnly cookies or server-side storage
- **Making all search requests in parallel:** Will hit rate limits; use sequential with small delays
- **Retrying failed matches immediately:** YouTube Music search is deterministic; same query = same result
- **Ignoring the `duplicates` parameter:** Default `duplicates=False` causes entire batch to fail if any duplicate exists

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YouTube Music API | HTTP client with cookie hacking | ytmusicapi | Handles auth, pagination, rate limiting, API changes |
| String similarity | Levenshtein from scratch | rapidfuzz | C++ implementation, optimized algorithms, 10-100x faster |
| Token refresh | Manual expiry tracking | ytmusicapi RefreshingToken | Auto-refreshes when token expires in <1 min |
| Unicode normalization | regex replacements | unidecode | Handles all Unicode scripts, accents, special chars |

**Key insight:** ytmusicapi abstracts away YouTube Music's undocumented internal API, which changes frequently. Building custom HTTP calls would break within weeks.

## Common Pitfalls

### Pitfall 1: OAuth Credential Scope
**What goes wrong:** Using wrong OAuth flow or missing YouTube Data API scopes
**Why it happens:** ytmusicapi requires "TVs and Limited Input devices" OAuth type, not web app
**How to avoid:** In Google Cloud Console, create OAuth credentials with type "TVs and Limited Input devices"
**Warning signs:** "invalid_client" or "unauthorized_client" errors during OAuth flow

### Pitfall 2: Search Rate Limiting
**What goes wrong:** API returns errors or empty results after many rapid searches
**Why it happens:** YouTube Music has undocumented rate limits (not official quota, but behavioral throttling)
**How to avoid:** Add 100-200ms delay between search requests; batch playlist item additions
**Warning signs:** Searches that worked before suddenly returning empty or error responses

### Pitfall 3: Track Matching False Positives
**What goes wrong:** Wrong song version (live, remix, cover) gets matched
**Why it happens:** Fuzzy matching too loose; not verifying artist
**How to avoid:** Always verify both track name AND artist match above threshold (>80%); prefer "songs" filter over "videos"
**Warning signs:** User complaints about wrong versions; noticeable quality drops

### Pitfall 4: Token Storage in Serverless
**What goes wrong:** OAuth tokens lost between function invocations
**Why it happens:** Serverless functions are stateless; filesystem writes don't persist
**How to avoid:** Store encrypted token in environment variable or external database; pass token in request
**Warning signs:** Users prompted to re-authenticate on every request

### Pitfall 5: add_playlist_items Duplicate Behavior
**What goes wrong:** Entire batch fails when one duplicate exists
**Why it happens:** Default `duplicates=False` rejects whole batch on any duplicate
**How to avoid:** Use `duplicates=True` or pre-filter known duplicates
**Warning signs:** "Duplicates found" errors; tracks not being added despite no visible errors

## Code Examples

Verified patterns from official sources:

### YouTube Music Authentication Setup
```python
# Source: https://ytmusicapi.readthedocs.io/en/stable/setup/oauth.html
import os
from ytmusicapi import YTMusic, OAuthCredentials
from ytmusicapi.auth.oauth import RefreshingToken

def get_ytmusic_client(oauth_token_json: str) -> YTMusic:
    """Create authenticated YTMusic client from stored token."""
    credentials = OAuthCredentials(
        client_id=os.environ['GOOGLE_CLIENT_ID'],
        client_secret=os.environ['GOOGLE_CLIENT_SECRET']
    )
    return YTMusic(oauth_token_json, oauth_credentials=credentials)

def start_device_auth_flow() -> dict:
    """Start OAuth device flow, return device code and user URL."""
    credentials = OAuthCredentials(
        client_id=os.environ['GOOGLE_CLIENT_ID'],
        client_secret=os.environ['GOOGLE_CLIENT_SECRET']
    )
    # This would be customized for web flow - return device code for frontend
    # User visits URL and enters code, then we poll for completion
    return credentials.get_device_code()
```

### Track Search with Filtering
```python
# Source: https://ytmusicapi.readthedocs.io/en/stable/reference.html
def search_track(ytmusic: YTMusic, track_name: str, artist_name: str) -> dict | None:
    """Search for a track on YouTube Music, return best match or None."""
    query = f"{artist_name} {track_name}"
    results = ytmusic.search(query, filter='songs', limit=5)

    if not results:
        return None

    # Results contain: videoId, title, artists (list), album
    # Return first result (YouTube's best match)
    result = results[0]
    return {
        'videoId': result['videoId'],
        'title': result['title'],
        'artist': result['artists'][0]['name'] if result.get('artists') else 'Unknown',
        'album': result.get('album', {}).get('name')
    }
```

### Playlist Creation and Population
```python
# Source: https://ytmusicapi.readthedocs.io/en/stable/reference/playlists.html
def create_and_populate_playlist(
    ytmusic: YTMusic,
    name: str,
    description: str,
    video_ids: list[str]
) -> str:
    """Create playlist and add tracks, return playlist ID."""
    playlist_id = ytmusic.create_playlist(name, description)

    # Add tracks in batches to avoid rate limits
    batch_size = 25
    for i in range(0, len(video_ids), batch_size):
        batch = video_ids[i:i + batch_size]
        ytmusic.add_playlist_items(playlist_id, videoIds=batch, duplicates=True)

    return playlist_id
```

### Fuzzy String Matching for Track Names
```python
# Source: https://github.com/rapidfuzz/RapidFuzz
from rapidfuzz import fuzz
from unidecode import unidecode
import re

def normalize_string(s: str) -> str:
    """Normalize string for comparison: lowercase, remove accents, strip punctuation."""
    s = unidecode(s.lower())
    s = re.sub(r'[^\w\s]', '', s)  # Remove punctuation
    s = re.sub(r'\s+', ' ', s).strip()  # Normalize whitespace
    return s

def calculate_match_confidence(
    search_result: dict,
    expected_track: str,
    expected_artist: str
) -> float:
    """Calculate match confidence (0-100) between search result and expected track."""
    result_title = normalize_string(search_result['title'])
    result_artist = normalize_string(search_result.get('artist', ''))

    expected_track_norm = normalize_string(expected_track)
    expected_artist_norm = normalize_string(expected_artist)

    title_score = fuzz.ratio(result_title, expected_track_norm)
    artist_score = fuzz.ratio(result_artist, expected_artist_norm)

    # Weight: 60% title, 40% artist
    return (title_score * 0.6) + (artist_score * 0.4)
```

### React SSE Client for Progress
```typescript
// Source: EventSource Web API + React patterns
function useTransferProgress(onProgress: (data: ProgressData) => void) {
  const startTransfer = async (playlistData: PlaylistData) => {
    const response = await fetch('/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playlistData),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n').filter(line => line.startsWith('data:'));

      for (const line of lines) {
        const data = JSON.parse(line.slice(5)); // Remove "data:" prefix
        onProgress(data);
      }
    }
  };

  return { startTransfer };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Browser cookie auth | OAuth with device flow | Nov 2024 | Requires Google Cloud Console setup; more stable |
| Manual token refresh | RefreshingToken class | ytmusicapi 1.x | Automatic refresh handled by library |
| fuzzywuzzy | rapidfuzz | 2020+ | 10-100x faster, MIT license |
| Polling for progress | SSE streaming | Web standard | Lower latency, less server load |

**Deprecated/outdated:**
- **Browser header auth:** Still works but requires manual cookie extraction every ~2 years; OAuth is more reliable
- **Out-of-band (OOB) OAuth:** Google deprecated this flow; use device code flow instead
- **fuzzywuzzy:** Still maintained but GPL licensed and slow; use rapidfuzz

## Open Questions

1. **Rate Limit Specifics**
   - What we know: YouTube Music has undocumented behavioral throttling; 100-200ms delays help
   - What's unclear: Exact limits per minute/hour; whether limits are per-user or per-client
   - Recommendation: Start conservative (200ms delay), monitor for errors, adjust dynamically

2. **Token Storage Strategy for Vercel**
   - What we know: Serverless is stateless; can't rely on filesystem
   - What's unclear: Best practice for multi-user scenario (each user has their own token)
   - Recommendation: For MVP, pass token in request body (frontend stores in memory); for production, consider Redis/KV store

3. **Match Confidence Threshold**
   - What we know: Need balance between false positives and missed matches
   - What's unclear: Optimal threshold (80%? 85%? 90%?)
   - Recommendation: Start with 80%, show "low confidence" warning for 70-80%, let user confirm borderline matches

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | vitest.config.mts |
| Quick run command | `npm run test:run -- --testPathPattern="youtube\|transfer\|match"` |
| Full suite command | `npm run test:run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DST-01 | OAuth flow initiates and completes | integration | `pytest api/tests/test_oauth.py -x` | No - Wave 0 |
| DST-02 | Playlist created with name/description | integration | `pytest api/tests/test_youtube_music.py::test_create_playlist -x` | No - Wave 0 |
| DST-03 | Tracks added to playlist | integration | `pytest api/tests/test_youtube_music.py::test_add_tracks -x` | No - Wave 0 |
| MTH-01 | Track search returns videoId | unit | `pytest api/tests/test_track_matcher.py::test_search -x` | No - Wave 0 |
| MTH-02 | Match results include matched/unmatched | unit | `pytest api/tests/test_track_matcher.py::test_results -x` | No - Wave 0 |
| UX-02 | Progress events stream correctly | integration | `npm run test:run -- TransferProgress` | No - Wave 0 |
| UX-03 | Summary displays counts correctly | unit | `npm run test:run -- TransferResults` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:run -- --testPathPattern="<changed_module>"`
- **Per wave merge:** `npm run test:run && pytest api/tests/ -x`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `api/tests/test_oauth.py` - OAuth flow tests with mocked Google responses
- [ ] `api/tests/test_youtube_music.py` - ytmusicapi wrapper tests
- [ ] `api/tests/test_track_matcher.py` - Track matching logic tests
- [ ] `src/components/TransferProgress.test.tsx` - SSE progress display tests
- [ ] `src/components/TransferResults.test.tsx` - Summary display tests
- [ ] `api/tests/conftest.py` - pytest fixtures for ytmusicapi mocking
- [ ] pytest framework install: `pip install pytest pytest-asyncio` (if not present)

## Sources

### Primary (HIGH confidence)
- [ytmusicapi PyPI](https://pypi.org/project/ytmusicapi/) - version 1.11.5, released Jan 31 2026
- [ytmusicapi Documentation](https://ytmusicapi.readthedocs.io/) - OAuth setup, API reference
- [ytmusicapi OAuth Guide](https://ytmusicapi.readthedocs.io/en/stable/setup/oauth.html) - Device flow setup
- [ytmusicapi Playlists Reference](https://ytmusicapi.readthedocs.io/en/stable/reference/playlists.html) - create_playlist, add_playlist_items
- [RapidFuzz GitHub](https://github.com/rapidfuzz/RapidFuzz) - String matching algorithms
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2) - OAuth 2.0 flows

### Secondary (MEDIUM confidence)
- [YouTube API Quota Guide](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits) - 10,000 units/day default
- [TuneLink Case Study](https://tommcfarlin.com/case-study-tunelink-matching-music-ai/) - Tiered search approach
- [Next.js SSE Guide](https://www.pedroalonso.net/blog/sse-nextjs-real-time-notifications/) - SSE implementation patterns
- [Vercel Authentication Guide](https://vercel.com/guides/application-authentication-on-vercel) - OAuth in serverless

### Tertiary (LOW confidence)
- Community reports on rate limiting behavior (anecdotal, varies by account)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - ytmusicapi is the only maintained option; well-documented
- Architecture: MEDIUM - OAuth device flow is documented but web app integration needs care
- Pitfalls: MEDIUM - Based on documentation and community reports, not firsthand testing

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (ytmusicapi is unofficial, may change with YouTube updates)
