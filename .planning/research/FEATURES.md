# Feature Landscape: Playlist Migration Tools

**Domain:** Playlist migration / music library transfer between streaming services
**Researched:** 2026-03-13
**Confidence:** HIGH (verified across multiple sources and competitors)

## Existing Solutions Analysis

### Major Commercial Competitors

| Tool | Platform | Free Tier | Paid Price | Strengths | Weaknesses |
|------|----------|-----------|------------|-----------|------------|
| **TuneMyMusic** | Web | 500 tracks | $2-4/month | Fastest transfers, official partnerships with Spotify/YouTube Music/Amazon | Wrong matches, billing complaints, 500 track free limit |
| **Soundiiz** | Web | 200 tracks/playlist, 1 sync | $4.50/month | 41+ services, advanced tools (merge/split/shuffle), auto-sync | Cloud processing (privacy concerns), limited free tier |
| **SongShift** | iOS/macOS only | Unlimited (slower) | $6.99/month | Match review UI, no free track limits, Apple ecosystem integration | iOS only, slower free tier, Premium required for liked songs/artists |
| **FreeYourMusic** | Web/Desktop/Mobile | Limited | $4.99/month | Cross-platform apps, smart matching | Poor matching accuracy (~50% incorrect per user reports), creates duplicates |
| **MusConv** | Web/Desktop/Mobile | Limited | $4.99-10.99/month | 125+ services, transfers artists/albums, rematch tool | Complex pricing tiers, heavier app |
| **PlaylistGo** | Desktop | Unknown | Unknown | Local processing (no cloud), batch export to CSV/M3U/JSON | Less established |
| **Playlisty** | iOS/macOS | Free tier | Paid tier | Fast Apple Music imports, simple | Apple-focused only |

### Open Source Alternatives

| Project | Status | Notable Features |
|---------|--------|------------------|
| **Melody-Migrate** | Under development | No transfer limits, free alternative to commercial tools |
| **Spotify-2-AppleMusic** | Active | ISRC-first matching, Python-based |
| **playlistor** | Active | Bidirectional Spotify/Apple Music, Docker-based |
| **spotify_apple_converter** | Active | Web app, ISRC matching |
| **PlaySync** | Active | Flask web interface, YouTube Music support |

Open source tools require manual API credential setup and technical knowledge. None have achieved consumer-ready polish.

### What Competitors Do Well

1. **TuneMyMusic**: Speed and official platform partnerships provide reliability and trust
2. **Soundiiz**: Advanced playlist manipulation (merge, split, shuffle, clone) beyond basic transfer
3. **SongShift**: Match review UI lets users verify and correct matches before transfer completes
4. **MusConv**: Broadest service support (125+), transfers followed artists and saved albums

### What Competitors Do Poorly

1. **Matching Accuracy**: User complaints consistently cite 20-50% incorrect matches
2. **Transparency**: No visibility into why matches fail or what algorithm is used
3. **Large Libraries**: Free tiers cap at 200-500 tracks; users with thousands of songs must pay
4. **API Limitations**: Most don't handle Spotify's 2026 API restrictions gracefully
5. **Privacy**: Web-based tools process data on their servers (Soundiiz explicitly)
6. **Error Recovery**: Failed transfers often require starting over; no resume capability

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Evidence |
|---------|--------------|------------|----------|
| **Playlist transfer** | Core use case | Medium | All competitors have this |
| **Liked/saved songs transfer** | Second most requested after playlists | Medium | SongShift Premium, TuneMyMusic, MusConv support this |
| **Spotify support** | Largest streaming platform | High (API restrictions) | Universal competitor support |
| **Apple Music support** | Second largest platform | Medium | Universal competitor support |
| **YouTube Music support** | Third major platform | Medium (unofficial API) | Most competitors support |
| **OAuth authentication** | Secure platform connection | Medium | Industry standard |
| **Progress indication** | Users need feedback during long transfers | Low | All tools show progress |
| **Missing song report** | Users need to know what failed | Low | FreeYourMusic, Soundiiz provide CSV export |
| **Preserve playlist names** | Basic metadata preservation | Low | All tools do this |
| **Preserve song order** | Playlist structure matters | Low | Most tools preserve order |

## Differentiators

Features that set product apart. Not expected, but create competitive advantage.

| Feature | Value Proposition | Complexity | Competitor Gap |
|---------|-------------------|------------|----------------|
| **Match review before transfer** | See and correct matches before committing | Medium | Only SongShift has good UI for this |
| **ISRC-first matching** | ~90% accuracy vs ~70% for title matching | Medium | Most rely on fuzzy title matching |
| **Local processing** | Privacy-preserving, no server uploads | Low | Most competitors use cloud processing |
| **Transparent match scoring** | Show users why matches were chosen | Low | No competitor shows confidence scores |
| **Followed artists transfer** | Complete library migration | Medium | Only MusConv and TuneMyMusic |
| **Saved albums transfer** | Complete library migration | Medium | Only MusConv and SongShift Premium |
| **Automatic sync** | Keep libraries aligned over time | High | Soundiiz Premium, FreeYourMusic |
| **Playlist manipulation tools** | Merge, split, shuffle, clone | Medium | Only Soundiiz has full suite |
| **No track limits** | Transfer entire libraries | Low | SongShift free tier; most cap at 200-500 |
| **Offline/desktop app** | Works without internet during matching | Medium | PlaylistGo only |
| **Export to file formats** | CSV, M3U, JSON backup | Low | Soundiiz, PlaylistGo |
| **Resume interrupted transfers** | Handle large libraries gracefully | Medium | No competitor advertises this |
| **Duplicate detection** | Don't re-add songs already in destination | Low | MusConv has this |

## Anti-Features

Features to deliberately NOT build. Either low value, high complexity, or problematic.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Podcast transfer** | Different domain, different APIs, limited user demand | Focus on music; document as out of scope |
| **Social/sharing features** | Feature creep, privacy concerns, not core value | Simple export to share with friends |
| **Music discovery/recommendations** | Not core migration use case, streaming services do this better | Focus on accurate transfer |
| **Playlist editing beyond transfer** | Scope creep into playlist management app | Transfer only; let source/destination apps handle editing |
| **Streaming playback** | Requires licensing, completely different product | Transfer only |
| **125+ service support** | Diminishing returns; focus on top 5-7 platforms | Support Spotify, Apple Music, YouTube Music, Amazon Music, Tidal, Deezer |
| **Cloud-based processing** | Privacy concerns, server costs, user trust issues | Local-first processing |
| **Subscription model from day one** | Barrier to adoption, competitors already crowded | Generous free tier or one-time purchase |

## Feature Dependencies

```
OAuth Integration → Platform Support → Playlist Reading → Song Matching → Transfer Execution
                                     ↓
                                    Liked Songs Support
                                     ↓
                                    Followed Artists Support
                                     ↓
                                    Saved Albums Support

Match Review UI → requires → Song Matching Algorithm

Export to Files → requires → Playlist Reading

Auto-Sync → requires → Transfer Execution + Scheduled Jobs
```

## User Expectations by Segment

### Casual Users (switching platforms once)
- Transfer completes successfully
- Most songs match correctly (80%+ acceptable)
- Clear indication of what didn't transfer
- Free or very cheap

### Power Users (large libraries, multiple platforms)
- High accuracy (95%+)
- Liked songs, artists, albums transfer
- No arbitrary limits
- Batch operations
- Worth paying for quality

### Privacy-Conscious Users
- No cloud processing
- Clear data handling
- Revoke access easily
- Open source preferred

## Critical Platform Considerations

### Spotify API (February 2026 Changes)

**CRITICAL**: Spotify significantly restricted API access in February 2026:
- Development Mode requires Premium subscription from app owner
- Limited to 5 authorized users per app in Development Mode
- Playlist contents only returned for user's own/collaborative playlists
- Extended Quota Mode requires 250,000+ MAU and registered business

**Implications:**
- Cannot build a consumer-facing Spotify integration in Dev Mode
- Must apply for Extended Quota Mode or find workaround
- User must own playlists to read their contents
- This is a major feasibility risk

### Apple Music (MusicKit)
- Requires Apple Developer Program membership
- Can create playlists, add to library with user permission
- ISRC lookup supported since WWDC22
- Some limitations on macOS (delete returns 401)
- Generally more permissive than Spotify

### YouTube Music
- No official API for YouTube Music specifically
- Unofficial `ytmusicapi` library (Python) is well-maintained
- Works by emulating web requests
- OAuth authentication required
- Risk: Could break with YouTube changes

## MVP Recommendation

### Must Have (Phase 1)
1. **Spotify playlist reading** (user's own playlists only due to API restrictions)
2. **Apple Music playlist creation**
3. **YouTube Music support** (via ytmusicapi)
4. **ISRC-first matching algorithm** for accuracy
5. **Match review UI** - show matches before committing
6. **Missing song report** - clear list of what didn't transfer
7. **Progress indication**

### Should Have (Phase 2)
1. **Liked songs transfer** (all platforms)
2. **Reverse direction** (Apple Music/YouTube to Spotify)
3. **Export to CSV/JSON** for backup
4. **Duplicate detection**

### Nice to Have (Phase 3)
1. **Followed artists transfer**
2. **Saved albums transfer**
3. **Amazon Music support**
4. **Tidal/Deezer support**
5. **Auto-sync** (scheduled re-transfers)

### Defer Indefinitely
- Podcast transfer
- 125+ platform support
- Social features
- Cloud-based architecture

## Pricing Strategy Observations

| Competitor | Model | Free Tier | Notes |
|------------|-------|-----------|-------|
| TuneMyMusic | Subscription | 500 tracks | Tight limit pushes to paid |
| Soundiiz | Subscription | 200 tracks/playlist | Even tighter |
| SongShift | Subscription | Unlimited but slow | Clever - free works, paid is better |
| MusConv | Subscription + Lifetime | Limited | $177 lifetime option |
| FreeYourMusic | Subscription | Limited | |

**Opportunity:**
- No major player offers generous free tier + one-time purchase
- SongShift's "unlimited free but slower" model is user-friendly
- Lifetime/one-time purchase fills market gap

## Sources

### Competitor Analysis
- [TuneMyMusic](https://www.tunemymusic.com/)
- [Soundiiz](https://soundiiz.com/)
- [SongShift](https://songshift.com/)
- [FreeYourMusic](https://freeyourmusic.com/)
- [MusConv](https://musconv.com/)
- [PlaylistGo](https://www.playlistgo.io/)

### Comparison Articles
- [TechHive: Spotify Playlist Transfer Apps](https://www.techhive.com/article/2425101/spotify-playlist-transfer-apps.html)
- [PlaylistGo: TuneMyMusic Alternatives](https://www.playlistgo.io/reviews/tunemymusic-alternative/)

### Technical Documentation
- [Spotify February 2026 Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)
- [Apple MusicKit](https://developer.apple.com/musickit/)
- [ytmusicapi Documentation](https://ytmusicapi.readthedocs.io/)

### User Feedback
- [FreeYourMusic Blog: Playlist Transfer Challenges](https://freeyourmusic.com/blog/understanding-playlist-transfer-challenges)
- [FreeYourMusic Blog: Migration Challenges](https://freeyourmusic.com/blog/music-playlist-migration-challenges)
- Reddit discussions on r/AppleMusic, r/YoutubeMusic, r/spotify

### Open Source Projects
- [Melody-Migrate](https://github.com/oogunjob/Melody-Migrate)
- [playlistor](https://github.com/akornor/playlistor)
- [Spotify-2-AppleMusic](https://github.com/nf1973/Spotify-2-AppleMusic)
