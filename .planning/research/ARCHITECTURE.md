# Architecture Patterns for Playlist Migration

**Domain:** Music playlist transfer between streaming services
**Researched:** 2026-03-13
**Confidence:** HIGH (verified against multiple open-source implementations and official API docs)

## Recommended Architecture

### High-Level Overview

```
+----------------+     +------------------+     +-------------------+
|  Source        | --> |  Core Engine     | --> |  Destination      |
|  Platform API  |     |  (Orchestrator)  |     |  Platform API     |
+----------------+     +------------------+     +-------------------+
        ^                      |                        ^
        |                      v                        |
        |              +------------------+             |
        |              |  Track Matcher   |             |
        |              +------------------+             |
        |                      |                        |
        v                      v                        v
+----------------+     +------------------+     +-------------------+
|  OAuth/Auth    |     |  State Manager   |     |  OAuth/Auth       |
|  Handler       |     |  (Progress/Retry)|     |  Handler          |
+----------------+     +------------------+     +-------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With | Isolation Reason |
|-----------|---------------|-------------------|------------------|
| **Auth Module** | OAuth flows, token storage, refresh | All platform APIs | Each platform has unique auth (OAuth 2.0 variants, JWT, cookies) |
| **Platform Adapters** | Read/write playlists, search tracks | Auth Module, Core Engine | Abstracts platform-specific API quirks behind common interface |
| **Track Matcher** | ISRC lookup, fuzzy matching, scoring | Platform Adapters | Matching logic is independent of source/destination |
| **Core Engine** | Orchestrates transfer flow, handles progress | All components | Central coordination point, manages state |
| **State Manager** | Progress tracking, retry logic, partial failure recovery | Core Engine | Enables resume-on-failure, idempotent operations |
| **UI Layer** | User interaction, playlist selection, progress display | Core Engine | Decoupled for web/CLI/desktop flexibility |

## Data Flow

### Transfer Sequence

```
1. USER AUTHENTICATION
   User --[OAuth redirect]--> Source Platform --[tokens]--> Auth Module
   User --[OAuth redirect]--> Dest Platform --[tokens]--> Auth Module

2. PLAYLIST RETRIEVAL
   Core Engine --[request playlists]--> Source Adapter
   Source Adapter --[paginated API calls]--> Source Platform API
   Source Adapter --[normalized playlist + tracks]--> Core Engine

3. TRACK MATCHING (per track)
   Core Engine --[source track metadata]--> Track Matcher
   Track Matcher --[ISRC lookup]--> Dest Adapter --[search by ISRC]--> Dest API
   (if ISRC fails)
   Track Matcher --[fuzzy search: artist + title]--> Dest Adapter
   Track Matcher --[match result with confidence]--> Core Engine

4. PLAYLIST CREATION
   Core Engine --[create playlist request]--> Dest Adapter
   Dest Adapter --[create playlist]--> Dest Platform API
   Core Engine --[add matched tracks]--> Dest Adapter (batched)

5. ERROR HANDLING
   On failure: State Manager records failed item
   On completion: Report matched/unmatched/failed counts
```

### Data Structures

**Normalized Track (internal representation):**
```typescript
interface NormalizedTrack {
  sourceId: string;           // Platform-specific ID
  isrc?: string;              // International Standard Recording Code
  title: string;
  artists: string[];          // Multiple artists possible
  album?: string;
  durationMs?: number;
  sourceUrl?: string;         // For user reference
}
```

**Match Result:**
```typescript
interface MatchResult {
  sourceTrack: NormalizedTrack;
  destinationId?: string;     // null if no match
  confidence: 'exact' | 'high' | 'medium' | 'low' | 'none';
  matchMethod: 'isrc' | 'fuzzy' | 'manual';
}
```

**Transfer State (for resume capability):**
```typescript
interface TransferState {
  transferId: string;
  sourcePlaylistId: string;
  destPlaylistId?: string;    // Set once created
  totalTracks: number;
  processedTracks: number;
  matched: MatchResult[];
  unmatched: NormalizedTrack[];
  failed: { track: NormalizedTrack; error: string }[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}
```

## Track Matching Strategy

Based on analysis of successful implementations, the recommended matching pipeline:

### Priority Order (execute in sequence, stop on match)

1. **ISRC Exact Match** (highest reliability, ~96% of tracks have ISRC)
   - Extract ISRC from source track
   - Query destination API by ISRC
   - Accept if single result returned

2. **Fuzzy String Match** (fallback)
   - Search destination by "artist title"
   - Apply Levenshtein distance scoring (RapidFuzz algorithm)
   - Accept if score >= 85 threshold
   - Consider: title, primary artist, duration (within 5 seconds)

3. **Manual Review Queue** (user intervention)
   - Tracks below threshold go to review
   - Present top 3-5 candidates to user
   - Allow skip/select

### Match Rate Expectations

- **ISRC available:** 90-98% match rate
- **Fuzzy fallback:** 70-85% match rate
- **Overall realistic:** 80-95% depending on catalog overlap

## Form Factor Trade-offs

### Web Application

**Pros:**
- No installation required
- Cross-platform by default
- Easier OAuth flow (redirect-based)
- Simpler updates/maintenance

**Cons:**
- Rate limits shared across users (unless self-hosted)
- Browser session timeouts for large transfers
- OAuth token storage concerns (security)
- Dependency on hosting infrastructure

**Best for:** Casual users, one-time transfers, broad accessibility

### Desktop Application

**Pros:**
- Offline processing possible (after auth)
- Local token storage (more secure)
- No rate limit sharing
- Large playlist handling without timeouts
- One-time purchase model viable

**Cons:**
- Platform-specific builds (Windows/Mac/Linux)
- Installation friction
- Update distribution complexity
- OAuth flow requires local server or browser integration

**Best for:** Power users, large libraries, privacy-conscious users

### CLI Tool

**Pros:**
- Scriptable, automatable
- Minimal resource usage
- Easy to integrate with other tools
- Developer-friendly

**Cons:**
- Non-technical user barrier
- OAuth flow awkward (device flow or local server)
- No visual feedback for progress

**Best for:** Developers, automated workflows, headless environments

### Recommendation

**Start with Web Application** for initial version:
- Fastest path to working product
- OAuth flows work naturally
- Validates core matching logic without platform complexity
- Can extract core engine to CLI/desktop later

**Architecture decision:** Build core engine as library/module, UI as thin layer. This enables future CLI/desktop without rewriting matching logic.

## Patterns to Follow

### Pattern 1: Platform Adapter Interface

Abstract all platform-specific logic behind a common interface.

**What:** Each streaming service implements the same interface
**When:** Always - this is the core abstraction
**Example:**
```typescript
interface PlatformAdapter {
  // Auth
  getAuthUrl(): string;
  exchangeToken(code: string): Promise<TokenPair>;
  refreshToken(refreshToken: string): Promise<TokenPair>;

  // Read
  getUserPlaylists(): AsyncGenerator<Playlist>;
  getPlaylistTracks(playlistId: string): AsyncGenerator<NormalizedTrack>;

  // Search
  searchByIsrc(isrc: string): Promise<NormalizedTrack | null>;
  searchByQuery(query: string): Promise<NormalizedTrack[]>;

  // Write
  createPlaylist(name: string, description?: string): Promise<string>;
  addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void>;
}
```

### Pattern 2: Generator-Based Pagination

Handle large playlists without memory exhaustion.

**What:** Use async generators for paginated API responses
**When:** Reading playlists, any paginated endpoint
**Example:**
```typescript
async function* getPlaylistTracks(playlistId: string): AsyncGenerator<Track> {
  let offset = 0;
  const limit = 50; // Spotify max, adjust per platform

  while (true) {
    const response = await api.getPlaylistItems(playlistId, { offset, limit });
    for (const item of response.items) {
      yield normalizeTrack(item);
    }
    if (response.items.length < limit) break;
    offset += limit;
  }
}
```

### Pattern 3: Exponential Backoff with Jitter

Handle rate limits gracefully.

**What:** Retry failed requests with increasing delays
**When:** Any API call that might hit rate limits
**Example:**
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryable(error) || attempt === maxRetries - 1) throw error;
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = Math.random() * 1000;
      await sleep(baseDelay + jitter);
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Pattern 4: Idempotent Operations

Enable safe retries and resume.

**What:** Operations can be repeated without duplicate side effects
**When:** All write operations
**Example:**
```typescript
// Before adding tracks, check if already added
async function addTracksIdempotent(playlistId: string, trackIds: string[]) {
  const existing = await getPlaylistTrackIds(playlistId);
  const toAdd = trackIds.filter(id => !existing.has(id));
  if (toAdd.length > 0) {
    await addTracks(playlistId, toAdd);
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Platform-Specific Logic in Core

**What:** Embedding Spotify/Apple/YouTube specific code in orchestration layer
**Why bad:** Makes adding new platforms exponentially harder
**Instead:** All platform specifics in adapters; core only uses interface

### Anti-Pattern 2: Assuming Track Order Preservation

**What:** Expecting destination playlist to maintain source order automatically
**Why bad:** Some platforms randomize or sort alphabetically by default
**Instead:** Explicitly set track positions after creation; verify order

### Anti-Pattern 3: Batch-All-At-Once Matching

**What:** Collecting all tracks, then matching all, then creating playlist
**Why bad:** Memory issues with large playlists (10,000+ tracks); no progress feedback; total loss on failure
**Instead:** Stream processing - match and insert in batches, persist progress

### Anti-Pattern 4: Single Auth Token Storage

**What:** Storing tokens in memory or single location
**Why bad:** Page refresh/app restart loses auth; forces re-authentication
**Instead:** Persist tokens securely (encrypted local storage / secure cookie / keychain); implement refresh flow

## Scalability Considerations

| Concern | Personal Use (<1000 tracks) | Medium (1000-10000 tracks) | Large (10000+ tracks) |
|---------|----------------------------|---------------------------|----------------------|
| **API Rate Limits** | Unlikely to hit | Implement backoff | Queue + background processing |
| **Memory** | Load all in memory OK | Stream/paginate | Mandatory streaming |
| **Progress** | Optional | Show percentage | Persistent state, resume |
| **Timeout** | Not an issue | Consider chunking | Background job with status polling |
| **Matching Speed** | Real-time | Show progress bar | Batch with notification on complete |

## Build Order (Dependencies)

### Phase 1: Foundation
1. **Auth Module** - Without auth, nothing works
2. **First Platform Adapter (Spotify)** - Most common source, best-documented API

### Phase 2: Core Transfer
3. **Track Matcher** - Core value of the product
4. **Second Platform Adapter (Apple Music or YouTube Music)** - Enables first real transfer

### Phase 3: Polish
5. **State Manager** - Resume capability, error recovery
6. **UI Layer** - User-facing experience

### Rationale
- Auth is prerequisite for everything
- Spotify first because it's the most common source platform and has excellent API docs
- Matcher before second platform because you need to design the normalization interface
- State manager after core works because it's optimization, not MVP
- UI last because CLI can validate everything first

## Platform-Specific Considerations

### Spotify
- OAuth 2.0 Authorization Code Flow
- 50 items per page for playlist tracks
- February 2026: Dev Mode now requires Premium subscription for app owner
- February 2026: Search limit reduced to 10 results max (was 50)
- ISRC available in track `external_ids`

### Apple Music
- JWT Developer Token + Music User Token
- Music User Token expires after ~6 months
- ISRC searchable directly in API
- MusicKit JS for web integration

### YouTube Music
- Uses YouTube Data API (not dedicated YT Music API)
- OAuth 2.0 for write access
- No official ISRC support - rely on fuzzy matching
- Consider unofficial `ytmusicapi` for better integration

## Sources

**Architecture Patterns:**
- [PlaySync GitHub](https://github.com/PlaySync/PlaySync) - Flask-based web architecture
- [Playlistor GitHub](https://github.com/akornor/playlistor) - Django + Celery architecture
- [Melody-Migrate GitHub](https://github.com/oogunjob/Melody-Migrate) - Vue.js web app

**Track Matching:**
- [spotify2qobuz](https://github.com/lievencardoen/spotify2qobuz) - ISRC + fuzzy matching strategy
- [How to Match Tracks Between Spotify and Apple Music](https://leemartin.dev/how-to-match-tracks-between-spotify-and-apple-music-2d6b6159957e) - ISRC cross-platform
- [FreeYourMusic Matching](https://support.freeyourmusic.com/helpdesk/KB/View/48552359-matching-songs) - Multi-strategy approach

**Platform APIs:**
- [Spotify Rate Limits](https://developer.spotify.com/documentation/web-api/concepts/rate-limits)
- [Spotify February 2026 Changes](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)
- [Apple Music MusicKit](https://developer.apple.com/musickit/)
- [User Authentication for MusicKit](https://developer.apple.com/documentation/applemusicapi/user-authentication-for-musickit)
- [ytmusicapi OAuth](https://ytmusicapi.readthedocs.io/en/stable/setup/oauth.html)

**Error Handling:**
- [Retry Pattern Guide (ByteByteGo)](https://blog.bytebytego.com/p/a-guide-to-retry-pattern-in-distributed)
- [Azure Transient Fault Handling](https://learn.microsoft.com/en-us/azure/architecture/best-practices/transient-faults)

**Industry Tools (for pattern reference):**
- [TuneMyMusic](https://www.tunemymusic.com/)
- [Soundiiz](https://soundiiz.com/)
- [FreeYourMusic](https://freeyourmusic.com/)
