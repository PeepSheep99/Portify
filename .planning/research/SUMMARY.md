# Project Research Summary

**Project:** PlaylistCopier
**Domain:** Music streaming playlist migration tool
**Researched:** 2026-03-13
**Confidence:** MEDIUM (Spotify's February 2026 API restrictions introduce significant unknowns)

## Executive Summary

PlaylistCopier is a playlist migration tool that moves music libraries between streaming platforms (Spotify, Apple Music, YouTube Music). The domain is well-understood — several commercial tools and open-source projects have solved this problem — but the landscape changed dramatically in February 2026 when Spotify restricted its API to require Premium subscriptions for development and imposed a hard 5-user cap in Development Mode. This fundamentally changes the architecture strategy: building Spotify as an export source for a consumer-facing app is now practically infeasible for an indie developer without a registered business and an existing 250,000 MAU user base.

The recommended approach is to start without Spotify as an export source. Build the core engine around Apple Music and YouTube Music first, using those platforms to validate matching logic and grow a user base. Spotify should be treated as an import destination only (reading the user's own playlists to bring them into another platform, which Spotify's ToS may permit under its "transfer personal data" clause). The core technical challenge is track matching: ISRC codes provide 95%+ accuracy between Spotify and Apple Music but are unavailable on YouTube Music, forcing a fuzzy text-matching fallback that delivers roughly 80-90% accuracy. A multi-layer matching pipeline (ISRC first, fuzzy fallback, manual review queue) is the industry-standard solution and directly addresses the top user complaint about competitors — poor match accuracy.

The two largest risks are legal and technical. Legally, Spotify's Developer Policy explicitly prohibits building apps that transfer content away from Spotify to competitors; violating this results in immediate API revocation (SongShift had to remove the feature in 2020). Technically, YouTube Music has no official API; the project must depend on the unofficial `ytmusicapi` Python library, which is actively maintained but could break at any time. Both risks are manageable with deliberate architecture decisions made before a single line of code is written.

---

## Key Findings

### Recommended Stack

The stack is Node.js (v20 LTS) with TypeScript 5.x for the core engine and web server (Express or Fastify). TypeScript is warranted here because the codebase must model complex, platform-specific API response shapes and normalize them through a shared interface. For Spotify, `spotify-web-api-node` provides a well-maintained client. Apple Music has no dominant library, so direct `fetch` + custom JWT generation is the standard approach. YouTube Music integration requires either a Python subprocess running `ytmusicapi` 1.11.5 or the TypeScript port `ytmusicapiJS`. SQLite is sufficient for caching track ID mappings locally; PostgreSQL would be needed only if scaling to multi-tenant cloud deployment. Developer cost floor is approximately $230/year ($99 Apple Developer + $10.99/month Spotify Premium for development access).

**Core technologies:**
- Node.js 20 LTS: runtime — best ecosystem for OAuth flows and async API clients
- TypeScript 5.x: type safety — complex API response normalization demands types
- Express/Fastify: web server — handles OAuth callbacks during auth flows
- spotify-web-api-node: Spotify client — well-maintained, TypeScript types available
- fetch + custom JWT: Apple Music client — no dominant library exists; rolling your own is standard
- ytmusicapi (Python) or ytmusicapiJS: YouTube Music client — only viable option; no official API exists
- SQLite: track mapping cache — simple, portable, no server needed for personal use scale

### Expected Features

The competitive landscape is crowded (TuneMyMusic, Soundiiz, SongShift, MusConv, FreeYourMusic) but uniformly criticized for poor matching accuracy (20-50% incorrect matches per user reports) and aggressive paywalls (200-500 track free limits). The gap is a tool that is accurate, transparent about matches, and generous with free usage.

**Must have (table stakes):**
- Playlist transfer (read from source, create on destination) — core use case
- Liked/saved songs transfer — second most requested feature after playlists
- Spotify, Apple Music, YouTube Music support — top three platforms by user volume
- OAuth authentication — industry standard for API access
- Progress indication during transfers — users abandon without feedback
- Missing song report — users need to know what failed to transfer
- Preserve playlist name and track order — basic expectations; competitors fail on order

**Should have (competitive differentiators):**
- Match review before transfer — only SongShift has good UI for this; high value
- ISRC-first matching — most competitors rely on fuzzy title matching; ISRC gives 95%+ accuracy
- Local processing (no cloud) — privacy differentiator; most competitors use cloud servers
- Transparent match scoring — show confidence level per track; no competitor does this
- Duplicate detection — prevent re-adding songs already on destination
- Export to CSV/JSON — playlist backup before and after transfer

**Defer to v2+:**
- Automatic sync (keep libraries aligned) — requires background jobs, high complexity
- Followed artists and saved albums transfer — valuable but not blocking MVP
- Amazon Music, Tidal, Deezer support — diminishing returns; focus on top 3 first
- Playlist manipulation tools (merge, split, shuffle) — scope creep toward Soundiiz territory

### Architecture Approach

The recommended architecture is a thin web UI over a well-isolated core engine. The core engine communicates exclusively with platform adapters through a common `PlatformAdapter` interface — no Spotify/Apple/YouTube-specific code ever touches the orchestration layer. This adapter pattern is the most important architectural decision: adding a fourth platform later should require only a new adapter file. The track matcher is completely independent of source and destination platforms, which means it can be tested in isolation and swapped to different algorithms without touching integration code. The State Manager enables resume-on-failure: every track's result is persisted before moving to the next, so a rate-limit mid-transfer doesn't require restarting from scratch. Build order strictly follows: Auth Module first, first platform adapter second, Track Matcher third, second adapter fourth, State Manager fifth, UI last (CLI first to validate everything).

**Major components:**
1. Auth Module — OAuth flows, token storage, refresh; handles Spotify PKCE, Apple Music JWT + MusicKit JS, Google OAuth
2. Platform Adapters (one per service) — normalize platform-specific API quirks behind a common interface; each service's weirdness is contained here
3. Track Matcher — ISRC lookup, fuzzy scoring (Levenshtein/RapidFuzz), manual review queue; core value proposition
4. Core Engine (Orchestrator) — transfer sequencing, progress tracking, coordinates all components
5. State Manager — persists transfer progress, enables resume-on-failure, idempotent write operations
6. UI Layer — web interface (later CLI/desktop); thin layer over core engine

### Critical Pitfalls

1. **Spotify ToS violation (exporting to competitors)** — Design Spotify as import destination ONLY. Spotify's policy explicitly prohibits building tools that transfer content away from Spotify to competing services. SongShift was forced to remove this feature in 2020. Architecture must encode this constraint from day one, not be patched in later.

2. **Spotify Extended Quota trap** — Development Mode is capped at 5 authorized users as of February 2026. Extended Quota requires 250K MAU and a registered business entity. Consequence: a Spotify-first MVP cannot reach real users. Solution: build and launch on Apple Music + YouTube Music first, grow user base, then incorporate as legal entity and apply for Spotify Extended Quota.

3. **YouTube Data API quota exhaustion** — Default 10,000 units/day. A single 500-song playlist transfer via search matching consumes 50,000+ units. Must cache track ID mappings aggressively, use ISRC before falling back to search, and implement quota-aware queuing. This must be designed in from the start, not added later.

4. **Apple Music token expiration without refresh** — Music User Tokens expire after ~6 months with no automated renewal. Apple Music cannot support "set and forget" sync. Design UX around periodic re-authentication; notify users at 5 months; do not promise ongoing sync on Apple Music.

5. **ytmusicapi reliability** — This unofficial library is the only path to YouTube Music. It can break without notice when YouTube updates its web client. Pin the version, monitor the GitHub issue tracker, and design the adapter layer so YouTube Music can be disabled cleanly if the library breaks. Do not treat it as a stable platform dependency.

---

## Implications for Roadmap

### Phase 1: Foundation and Architecture
**Rationale:** Legal and architectural decisions must precede any code. Platform strategy (Spotify as import-destination only) shapes the entire codebase. Auth is a prerequisite for everything; rate-limit handling must be baked into the HTTP layer from day one, not retrofitted.
**Delivers:** Auth module (Spotify PKCE, Apple Music JWT + MusicKit JS, YouTube OAuth), base Platform Adapter interface, HTTP client wrapper with exponential backoff and Retry-After handling, project scaffold with TypeScript configuration.
**Addresses:** Table-stakes OAuth authentication; foundational security
**Avoids:** Spotify ToS violation (architecture decision); rate-limit bans (Pitfall 8); broken API usage (February 2026 API changes)

### Phase 2: Core Transfer Engine (Apple Music + YouTube Music)
**Rationale:** Build the full transfer pipeline without Spotify first. This validates the matching algorithm, generates a user base, and avoids the Spotify 5-user cap. Apple Music and YouTube Music together represent a large enough audience to prove the product. Track Matcher must be built before the second adapter because the normalization interface design drives both.
**Delivers:** Apple Music adapter (read + write playlists, ISRC lookup), YouTube Music adapter (via ytmusicapi, fuzzy-only), Track Matcher (ISRC pipeline + fuzzy fallback + manual review queue), Core Engine orchestration, basic progress indication, missing song report.
**Implements:** Platform Adapter pattern, Generator-based pagination, ISRC-first matching, NormalizedTrack and MatchResult data structures
**Avoids:** Song matching failures (Pitfall 5), YouTube quota exhaustion (Pitfall 6), Apple Music DELETE failures (Pitfall 7), playlist order loss (Pitfall 9)

### Phase 3: State Manager and Resilience
**Rationale:** Once the core transfer pipeline works, add resume-on-failure before exposing to broader users. Large libraries (10K+ tracks) require persistent state. Duplicate detection and playlist order verification are polish items that address the top competitor criticisms.
**Delivers:** Transfer state persistence (SQLite), resume-interrupted-transfers, duplicate detection, playlist order preservation verification, export to CSV/JSON backup before transfer.
**Implements:** TransferState data structure, idempotent write operations, State Manager component
**Avoids:** Partial transfer loss, duplicate track creation (Pitfall 11), playlist order loss (Pitfall 9), no-backup failures (Pitfall 12)

### Phase 4: Spotify Integration (Import Destination Only)
**Rationale:** Add Spotify only after the product is working and a user base exists. Apply for Extended Quota Mode before heavy Spotify development. Treat Spotify only as a destination (import to Spotify), not a source, to stay within ToS boundaries. Legal counsel should review the "transfer personal data" exception interpretation before this phase ships.
**Delivers:** Spotify adapter (create playlists, add tracks, liked songs import), Spotify-as-destination transfers from Apple Music and YouTube Music.
**Avoids:** Spotify ToS violation (critical, architecture constraint), Extended Quota rejection (grow users first, Pitfall 2)

### Phase 5: Liked Songs and Library Transfer
**Rationale:** After playlists work reliably across all three platforms, extend to the full library migration use case. Liked songs are the second most requested feature; followed artists and saved albums serve power users.
**Delivers:** Liked/saved songs transfer on all platforms, followed artists transfer (where APIs permit), saved albums transfer.
**Addresses:** Power-user segment; complete library migration

### Phase Ordering Rationale

- Auth and architecture must come first because platform strategy is a legal and design constraint, not a feature decision. Building anything before deciding "Spotify is import-only" risks a complete rewrite.
- Spotify is Phase 4, not Phase 1, because the 5-user Development Mode cap makes it impossible to do real user testing until Extended Quota is approved — and that approval requires an existing user base and legal business entity.
- State Manager (Phase 3) comes after the core pipeline (Phase 2) because it is optimization, not MVP. Getting the core transfer working and in users' hands faster is higher value than robustness on day one.
- Liked songs (Phase 5) are separated from playlists (Phase 2) because they involve different API endpoints and auth scopes, and the playlist transfer needs to be proven solid first.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Spotify Integration):** Legal interpretation of Spotify's "transfer personal data" exception requires legal counsel review before writing code. Extended Quota application process and timeline need research.
- **Phase 2 (YouTube Music via ytmusicapi):** The library's current stability, any breakages since January 2026, and the JavaScript port (ytmusicapiJS) maturity need current-state verification before implementation begins.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** OAuth flows, exponential backoff, TypeScript project setup are all well-documented patterns with extensive prior art.
- **Phase 3 (State Manager):** SQLite persistence, idempotent operations, and resume patterns are established; no novel research needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core technologies (Node.js, TypeScript) are well-established. Uncertainty comes from ytmusicapi stability (unofficial) and Spotify API continued evolution. |
| Features | HIGH | Verified against 7 commercial competitors and multiple open-source projects; user complaints are consistent and well-documented. |
| Architecture | HIGH | Adapter pattern, generator pagination, exponential backoff, and idempotent operations are validated against multiple open-source implementations. |
| Pitfalls | HIGH | Spotify ToS precedent (SongShift 2020), Extended Quota requirements, and Apple Music token behavior are all from official documentation or documented incidents. |

**Overall confidence:** MEDIUM — Features and architecture are solid. Stack is mostly solid with one uncertain dependency (ytmusicapi). The largest uncertainty is the strategic/legal question around Spotify's ToS interpretation, which no amount of additional technical research can resolve.

### Gaps to Address

- **Spotify "transfer personal data" ToS exception:** Spotify's Developer Policy explicitly permits users to "transfer their personal data, or the metadata of the user's playlists to another service." Whether this extends to reading playlist tracks via the API and writing them to a competitor is legally ambiguous. Legal counsel review is recommended before Phase 4 development begins. Handle during Phase 4 planning.
- **ytmusicapi current stability:** Research was performed as of January 2026 (library version 1.11.5). Verify current GitHub status and any breaking changes before beginning Phase 2 implementation. The ytmusicapiJS TypeScript port maturity should also be evaluated as an alternative to a Python subprocess.
- **Deezer, Amazon Music, Tidal APIs:** Not researched. If these platforms appear in requirements, dedicated research is needed before they can be planned.
- **Audio fingerprinting fallback (ACRCloud):** Could improve match rates for tracks not found via ISRC or fuzzy search. Cost at scale not evaluated. Flag for consideration during Phase 2 if match rates fall below target.

---

## Sources

### Primary (HIGH confidence)
- [Spotify Developer Policy](https://developer.spotify.com/policy) — ToS restrictions, transfer permissions
- [Spotify February 2026 Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide) — breaking API changes
- [Spotify March 2026 Changelog](https://developer.spotify.com/documentation/web-api/references/changes/march-2026) — ISRC availability confirmed
- [Spotify Quota Modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes) — Extended Quota requirements
- [Apple Music API Documentation](https://developer.apple.com/documentation/applemusicapi/) — endpoints, ISRC lookup, auth
- [Apple Developer: User Authentication for MusicKit](https://developer.apple.com/documentation/applemusicapi/user-authentication-for-musickit) — token expiration behavior
- [YouTube Data API Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost) — quota cost analysis
- [ytmusicapi Documentation](https://ytmusicapi.readthedocs.io/) — YouTube Music unofficial API

### Secondary (MEDIUM confidence)
- [TechCrunch: Spotify API Changes February 2026](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/) — Spotify policy change coverage
- [AppleInsider: Spotify Threatening Developers](https://appleinsider.com/articles/20/10/12/spotify-reportedly-threatens-developers-over-transferring-playlists-to-other-services) — SongShift ToS incident
- [FreeYourMusic: Playlist Migration Challenges](https://freeyourmusic.com/blog/music-playlist-migration-challenges) — match failure rates
- [How to Match Tracks Between Spotify and Apple Music](https://leemartin.dev/how-to-match-tracks-between-spotify-and-apple-music-2d6b6159957e) — ISRC cross-platform strategy
- PlaySync, Playlistor, Melody-Migrate GitHub repositories — architecture pattern reference

### Tertiary (LOW confidence)
- Reddit discussions (r/AppleMusic, r/YoutubeMusic, r/spotify) — user expectations and pain points; anecdotal but consistent
- Apple Developer Forums (MusicKit token issues, DELETE 401 bug) — unresolved known issues, no official fix documented

---
*Research completed: 2026-03-13*
*Ready for roadmap: yes*
