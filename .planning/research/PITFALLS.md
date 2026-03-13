# Domain Pitfalls: Playlist Migration Tools

**Domain:** Music Streaming Playlist Migration
**Researched:** 2026-03-13
**Confidence:** HIGH (based on official platform documentation and verified incidents)

---

## Critical Pitfalls

Mistakes that cause project failure, legal action, or complete rewrites.

### Pitfall 1: Spotify Terms of Service Violation - Transfer Restrictions

**What goes wrong:** Building an app that transfers playlists FROM Spotify TO competing services violates Spotify's Developer Terms and results in API access revocation.

**Why it happens:** Developers assume that since users own their playlists, they can build any export tool. Spotify explicitly prohibits this in their Developer Policy.

**Evidence:** SongShift received notice from Spotify in October 2020 that transferring from Spotify to competing services violated ToS, forcing them to remove the feature in v5.1.2. Spotube received a cease-and-desist in early 2025 for combining Spotify API with third-party audio.

**Consequences:**
- Immediate API access revocation
- Potential legal action
- Complete loss of Spotify integration
- Reputation damage

**Warning signs:**
- Building export-from-Spotify functionality
- Using Spotify metadata with non-Spotify audio sources
- Charging for Spotify data access

**Prevention:**
- Read Spotify Developer Policy Section III.B carefully before design
- Spotify explicitly allows: "enabling a user to transfer their personal data, or the metadata of the user's playlists to another service"
- This permission is narrow - consult legal counsel on interpretation
- Consider Spotify as import-only destination, not export source
- Build clear user consent flows documenting data ownership

**Which phase should address:** Phase 1 (Foundation) - Architecture must be designed around this constraint from the start.

**Sources:**
- [Spotify Developer Policy](https://developer.spotify.com/policy)
- [AppleInsider: Spotify threatening developers](https://appleinsider.com/articles/20/10/12/spotify-reportedly-threatens-developers-over-transferring-playlists-to-other-services)

---

### Pitfall 2: Spotify Extended Quota Rejection Trap

**What goes wrong:** Developers build and launch apps only to discover they cannot get production API access. Development Mode limits apps to 5 users (as of February 2026), making real testing and launch impossible.

**Why it happens:** Extended Quota requires:
- Legally registered business entity
- 250,000 monthly active users
- Presence in key Spotify markets
- Actively launched service

This creates a paradox: you need users to get access, but you need access to get users.

**Consequences:**
- App stuck in development limbo with 5 user limit
- Over 95% of applications rejected
- 3+ month review cycles with minimal feedback
- Wasted development time

**Warning signs:**
- Planning to build without existing user base
- Individual developer (not registered business)
- No path to 250K MAU before Spotify integration

**Prevention:**
- Build and launch MVP with OTHER platforms first (Apple Music, YouTube Music)
- Grow user base on non-Spotify platforms
- Incorporate as legal business entity early
- Apply for quota BEFORE heavy Spotify development
- Consider whether Spotify is essential for MVP

**Which phase should address:** Phase 0 (Planning) - Business entity and platform strategy must be decided before development.

**Sources:**
- [Spotify: Updating Criteria for Extended Access](https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access)
- [TechCrunch: Spotify API Changes February 2026](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/)

---

### Pitfall 3: February 2026 Spotify API Breaking Changes

**What goes wrong:** Code written against pre-February 2026 API breaks completely after migration deadline.

**Why it happens:** Spotify made sweeping changes including:
- Development Mode now requires Premium subscription from app owner
- `/tracks` endpoints renamed to `/items`
- `POST /users/{user_id}/playlists` REMOVED (cannot create playlists for users)
- `PUT /playlists/{playlist_id}/tracks` REMOVED (cannot reorder/replace items)
- `GET /search` limit reduced from 50 to 10 results, default from 20 to 5
- Get Playlist only returns items for user's OWN playlists; other playlists return metadata only

**Consequences:**
- Core functionality breaks
- Search-based matching severely limited
- Cannot access full playlist contents from other users
- Cannot create/manage playlists via deprecated endpoints

**Warning signs:**
- Using any deprecated endpoints
- Relying on high search result counts
- Accessing other users' playlist contents

**Prevention:**
- Use ONLY endpoints from March 2026 documentation
- Design matching algorithms to work with 10-result search limit
- Accept that accessing other users' playlist contents requires Extended Quota
- Test with Premium account from project start

**Which phase should address:** Phase 1 (Foundation) - All Spotify integration code must target current API.

**Sources:**
- [Spotify February 2026 Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)
- [Spotify March 2026 Changelog](https://developer.spotify.com/documentation/web-api/references/changes/march-2026)

---

### Pitfall 4: Apple Music Token Expiration Without Refresh

**What goes wrong:** Apple Music integration stops working after ~6 months with no way to automatically renew user tokens.

**Why it happens:** Unlike Spotify's OAuth with refresh tokens, Apple Music User Tokens expire after approximately 6 months with NO automatic renewal mechanism. The authentication workflow must be completely repeated.

**Consequences:**
- Silent failures 6 months post-authentication
- Users must re-authenticate periodically
- Server-side/background sync impossible long-term
- Poor UX for returning users

**Warning signs:**
- Building any long-lived Apple Music integration
- Planning background/automatic sync features
- Assuming OAuth refresh token patterns work

**Prevention:**
- Implement proactive re-authentication prompts before expiry
- Track token issue dates and notify users at ~5 months
- Design UX around periodic re-authentication requirement
- Do NOT promise "set and forget" sync with Apple Music
- Consider Apple Music primarily for one-time transfers, not ongoing sync

**Which phase should address:** Phase 2 (Platform Integration) - Authentication architecture must account for this limitation.

**Sources:**
- [Apple Developer: User Authentication for MusicKit](https://developer.apple.com/documentation/applemusicapi/user-authentication-for-musickit)
- [Apple Developer Forums: MusicKit User Token Issues](https://developer.apple.com/forums/thread/703942)

---

## Moderate Pitfalls

Mistakes that cause significant rework or poor user experience.

### Pitfall 5: Song Matching Failures (40% Playlist Degradation)

**What goes wrong:** Nearly 40% of playlist transfers result in missing or mismatched songs, leading to poor user experience and support burden.

**Why it happens:**
- ISRC codes are not universal identifiers (each version/remix/remaster has different ISRC)
- Platforms use different metadata formats and normalization
- Same song may have different titles, artist names, or album associations across platforms
- Regional licensing makes songs unavailable in certain markets

**Consequences:**
- User frustration and abandonment
- High support volume
- Poor reviews citing "missing songs"
- Up to 20% track loss per transfer

**Warning signs:**
- Matching only on exact title/artist strings
- Not using ISRC when available
- No fuzzy matching fallback
- Not handling regional availability

**Prevention:**
- Implement multi-layer matching: ISRC > title+artist+album > title+artist > fuzzy match
- Use audio fingerprinting services (ACRCloud) as final fallback for critical matches
- Show users unmatched tracks with manual search capability
- Export unmatched tracks as CSV/report for manual resolution
- Indicate confidence level for each match
- Check regional availability before reporting success

**Which phase should address:** Phase 2-3 (Platform Integration) - Core matching algorithm is central to product quality.

**Sources:**
- [FreeYourMusic: Playlist Migration Challenges](https://freeyourmusic.com/blog/music-playlist-migration-challenges)
- [FreeYourMusic: Common Playlist Transfer Issues](https://freeyourmusic.com/blog/common-playlist-transfer-issues-guide)

---

### Pitfall 6: YouTube Data API Quota Exhaustion

**What goes wrong:** App hits daily quota limit mid-transfer, leaving playlists partially migrated.

**Why it happens:**
- Default quota: 10,000 units/day
- Search operations cost 100 units each
- Playlist write operations cost 50+ units each
- A 500-song playlist requiring search matching + creation could consume 50,000+ units

**Consequences:**
- Partial transfers stuck until next day
- Poor UX with incomplete playlists
- Users blaming app for "broken" functionality
- Quota exceeded errors are not obvious to users

**Warning signs:**
- Large playlist migrations (100+ songs)
- Multiple users transferring simultaneously
- Using search for every track match
- Not caching resolved track IDs

**Prevention:**
- Cache track ID mappings aggressively (song X on Spotify = song Y on YouTube)
- Use batch operations where available
- Implement transfer queuing with quota awareness
- Pre-check quota remaining before starting large transfers
- Use ISRC lookups before falling back to search
- Communicate estimated quota usage and potential delays to users

**Which phase should address:** Phase 2 (Platform Integration) - YouTube integration must include quota management from start.

**Sources:**
- [YouTube Data API Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
- [YouTube API Quota Guide](https://getlate.dev/blog/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota)

---

### Pitfall 7: Apple Music DELETE Operations Fail Silently

**What goes wrong:** Playlist deletion/modification operations return 401 errors even with valid tokens, causing sync features to fail.

**Why it happens:** Known Apple Music API bug where DELETE always returns 401 even immediately after creation with valid tokens. MusicKit write APIs are also unavailable on macOS.

**Consequences:**
- Cannot delete or fully manage playlists programmatically
- Sync features that require deletion fail
- Platform inconsistency in what operations work
- Developers waste time debugging "auth issues" that are API bugs

**Warning signs:**
- Planning full CRUD operations on Apple Music playlists
- Implementing sync that requires playlist deletion
- Testing only on iOS (missing macOS MusicKit limitations)

**Prevention:**
- Design around CREATE-only workflow for Apple Music
- Document clearly that Apple Music playlists cannot be deleted via API
- Use "archive" patterns instead of delete (rename with prefix)
- Test on all target platforms (iOS, web, macOS) early
- Monitor Apple Developer Forums for status updates

**Which phase should address:** Phase 2 (Platform Integration) - Apple Music integration scope must be realistic.

**Sources:**
- [Apple Developer Forums: Playlist Delete Issues](https://developer.apple.com/forums/thread/123894)

---

### Pitfall 8: Rate Limit Handling Without Exponential Backoff

**What goes wrong:** App gets temporarily or permanently banned from APIs due to aggressive retry behavior after rate limit errors.

**Why it happens:**
- Spotify: Rolling 30-second window, ~20 requests/second recommended
- Apple Music: 20 requests/second per user
- YouTube: Quota-based (not rate-based)
- Developers implement simple retry logic without proper backoff

**Consequences:**
- Temporary bans escalate to permanent bans
- All users affected by single-tenant API issues
- Support tickets about "app not working"

**Warning signs:**
- Fixed-delay retries on 429 errors
- No respect for Retry-After headers
- Parallel requests without coordination
- No circuit breaker pattern

**Prevention:**
- Implement exponential backoff with jitter
- Respect Retry-After headers exactly
- Use request queuing with rate limiting
- Implement circuit breaker for persistent failures
- Consider per-user request isolation
- Log rate limit incidents for monitoring

**Which phase should address:** Phase 1 (Foundation) - HTTP client wrapper must handle this correctly from start.

**Sources:**
- [Spotify Rate Limits](https://developer.spotify.com/documentation/web-api/concepts/rate-limits)

---

### Pitfall 9: Playlist Order Loss During Transfer

**What goes wrong:** Carefully curated playlist order becomes randomized or alphabetized after transfer.

**Why it happens:**
- Some migration tools prioritize matching over sequence preservation
- Batch operations may not guarantee order
- APIs may not support position specification
- Error recovery can disrupt ordering

**Consequences:**
- DJ playlists become unusable
- Workout/mood playlists lose flow
- Users perceive transfer as "broken" even if all songs present

**Warning signs:**
- Using Set instead of List data structures
- Not tracking original position
- Batch adding without position parameter
- No verification step

**Prevention:**
- Track original position for every track
- Add tracks sequentially OR use explicit position parameters
- Verify order after transfer completion
- Allow user to reorder manually if needed
- Test with playlists where order matters (DJ mixes, etc.)

**Which phase should address:** Phase 2-3 (Platform Integration) - Track data model must include position.

---

## Minor Pitfalls

Mistakes that cause friction but are recoverable.

### Pitfall 10: UTF-8 Encoding Mismatches

**What goes wrong:** Track names with non-ASCII characters (accents, CJK, emoji) fail to match or display incorrectly.

**Why it happens:** Encoding mismatches cause 15-30% of reported migration errors. Different platforms may normalize Unicode differently.

**Prevention:**
- Normalize all strings to NFC Unicode before comparison
- Use Unicode-aware comparison libraries
- Test with international track names (Japanese, Korean, Arabic, accented European)
- Log encoding-related match failures separately

**Which phase should address:** Phase 2 (Platform Integration) - String handling utilities.

---

### Pitfall 11: Duplicate Track Creation

**What goes wrong:** Same track added multiple times due to matching multiple versions (album, single, remaster).

**Why it happens:** One ISRC can map to multiple platform entries. Search returns multiple valid matches.

**Prevention:**
- Deduplicate by ISRC before adding
- Show preview and let user choose version
- Prefer album version over singles
- Track already-added ISRCs during transfer

**Which phase should address:** Phase 2-3 (Platform Integration) - Deduplication in matching logic.

---

### Pitfall 12: No Backup Before Migration

**What goes wrong:** Transfer fails partway and user has no record of original playlist.

**Why it happens:** Developers assume source platform is always available. Users may delete source playlist after starting transfer.

**Prevention:**
- Export source playlist to JSON/CSV before transfer starts
- Store backup with timestamp in user-accessible location
- Document this as critical pre-transfer step in UX

**Which phase should address:** Phase 3 (Core Features) - Backup workflow in transfer process.

**Sources:**
- [FreeYourMusic: Common Issues Guide](https://freeyourmusic.com/blog/common-playlist-transfer-issues-guide)

---

## Legal/ToS Considerations Summary

| Platform | Key Restrictions | Risk Level |
|----------|-----------------|------------|
| **Spotify** | Cannot transfer FROM Spotify to competitors; Premium required for dev mode; Extended quota needs 250K MAU + business entity | CRITICAL |
| **Apple Music** | $99/year developer account required; proprietary auth (not OAuth); no auto token refresh; DELETE operations broken | MODERATE |
| **YouTube Music** | No official API (YouTube Data API only); quota-based limits; 10K units/day default | MODERATE |
| **All Platforms** | Cannot use metadata to train AI/ML; cannot sell API data; cannot use for commercial broadcast | CRITICAL |

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Architecture** | Building Spotify export-first | Design import-to-Spotify, export-from-others |
| **Platform Selection** | Assuming all platforms equal | Start with YouTube Music + Apple Music; add Spotify import only |
| **Authentication** | Copying Spotify OAuth to Apple Music | Implement platform-specific auth; plan for Apple token expiry |
| **Matching Algorithm** | Exact string matching only | Multi-layer: ISRC > metadata > fuzzy |
| **Rate Limiting** | Simple retry on error | Exponential backoff + circuit breaker from day 1 |
| **Quota Management** | Ignoring YouTube quotas | Track usage; cache mappings; queue large transfers |
| **Testing** | Testing only happy path | Test: large playlists, international characters, regional restrictions |
| **Business Setup** | Individual developer account | Incorporate business entity early for Spotify extended quota path |

---

## Research Gaps

Areas needing phase-specific deeper investigation:

1. **Exact interpretation of Spotify's "transfer personal data" permission** - Legal counsel recommended
2. **YouTube Music unofficial API (ytmusicapi) longevity and risk** - No official API alternative
3. **Deezer, Amazon Music, Tidal API availability and restrictions** - Not researched in depth
4. **Audio fingerprinting service costs at scale (ACRCloud pricing)** - For high-volume matching fallback

---

## Sources

### Official Documentation
- [Spotify Developer Policy](https://developer.spotify.com/policy)
- [Spotify Developer Terms](https://developer.spotify.com/terms)
- [Spotify February 2026 Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)
- [Spotify Rate Limits](https://developer.spotify.com/documentation/web-api/concepts/rate-limits)
- [Spotify Quota Modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)
- [Apple Music API Documentation](https://developer.apple.com/documentation/applemusicapi/)
- [Apple MusicKit](https://developer.apple.com/musickit/)
- [YouTube Data API Playlists](https://developers.google.com/youtube/v3/docs/playlists)
- [YouTube Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)

### Industry Analysis
- [FreeYourMusic: Playlist Migration Challenges](https://freeyourmusic.com/blog/music-playlist-migration-challenges)
- [FreeYourMusic: Common Transfer Issues](https://freeyourmusic.com/blog/common-playlist-transfer-issues-guide)
- [TechCrunch: Spotify API Changes 2026](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/)
- [AppleInsider: Spotify Threatening Developers](https://appleinsider.com/articles/20/10/12/spotify-reportedly-threatens-developers-over-transferring-playlists-to-other-services)

### Developer Community
- [Spotify Community Forums: Extended Quota](https://community.spotify.com/t5/Spotify-for-Developers/Updating-the-Criteria-for-Web-API-Extended-Access/td-p/6920661)
- [Apple Developer Forums: MusicKit Issues](https://developer.apple.com/forums/thread/703942)
- [ytmusicapi Documentation](https://ytmusicapi.readthedocs.io/)
