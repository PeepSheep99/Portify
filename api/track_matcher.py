"""Track matching logic for finding Spotify tracks on YouTube Music (MTH-01, MTH-02)."""
import re
import time
from typing import TypedDict, NotRequired

from unidecode import unidecode
from rapidfuzz import fuzz


class MatchedTrack(TypedDict):
    """A successfully matched track."""
    original: dict
    matched: dict
    confidence: float


class UnmatchedTrack(TypedDict):
    """A track that could not be matched."""
    original: dict
    reason: str  # 'not_found' | 'low_confidence' | 'api_error'


class MatchResult(TypedDict):
    """Result of batch track matching."""
    matched: list[MatchedTrack]
    unmatched: list[UnmatchedTrack]
    total: int
    match_rate: float


def normalize_string(s: str) -> str:
    """Normalize string for fuzzy matching.

    - Converts to lowercase
    - Strips accents using unidecode
    - Removes punctuation
    - Normalizes whitespace

    Args:
        s: The string to normalize

    Returns:
        Normalized string suitable for fuzzy matching
    """
    if not s:
        return ""

    # Strip accents using unidecode
    s = unidecode(s)

    # Convert to lowercase
    s = s.lower()

    # Remove punctuation (keep alphanumeric and whitespace)
    s = re.sub(r'[^\w\s]', '', s)

    # Normalize whitespace
    s = ' '.join(s.split())

    return s


def calculate_confidence(
    result: dict,
    expected_track: str,
    expected_artist: str
) -> float:
    """Calculate confidence score for a search result.

    Uses weighted fuzzy matching: 60% title, 40% artist.

    Args:
        result: YouTube Music search result dict with 'title' and 'artists'
        expected_track: The expected track name from Spotify
        expected_artist: The expected artist name from Spotify

    Returns:
        Confidence score from 0-100
    """
    # Normalize inputs
    expected_track_norm = normalize_string(expected_track)
    expected_artist_norm = normalize_string(expected_artist)

    # Get result data
    result_title = normalize_string(result.get('title', ''))

    # Handle artists list
    artists = result.get('artists', [])
    if artists and len(artists) > 0:
        result_artist = normalize_string(artists[0].get('name', ''))
    else:
        result_artist = ''

    # Calculate fuzzy match scores
    title_score = fuzz.ratio(expected_track_norm, result_title)

    if result_artist and expected_artist_norm:
        artist_score = fuzz.ratio(expected_artist_norm, result_artist)
    elif not result_artist:
        # If no artist in result, only use title (with reduced weight)
        artist_score = 0
    else:
        artist_score = 0

    # Weighted average: 60% title, 40% artist
    confidence = (title_score * 0.6) + (artist_score * 0.4)

    # Clamp to 0-100
    return max(0, min(100, confidence))


def search_track(
    ytmusic,
    track_name: str,
    artist_name: str,
    min_confidence: float = 70
) -> dict | None:
    """Search for a track on YouTube Music using tiered search.

    Tier 1: Search "{artist_name} {track_name}" with filter='songs'
    Tier 2: If no match, search "{track_name}" only

    Args:
        ytmusic: Authenticated YTMusic client
        track_name: Track name to search for
        artist_name: Artist name to search for
        min_confidence: Minimum confidence score to accept (0-100)

    Returns:
        Best matching result with videoId, title, artist, confidence
        or None if no match meets threshold
    """
    try:
        # Tier 1: Search with artist and title
        query = f"{artist_name} {track_name}"
        results = ytmusic.search(query, filter='songs', limit=5)

        best_match = _find_best_match(results, track_name, artist_name, min_confidence)
        if best_match:
            return best_match

        # Tier 2: Search with title only
        results = ytmusic.search(track_name, filter='songs', limit=10)
        best_match = _find_best_match(results, track_name, artist_name, min_confidence)
        if best_match:
            return best_match

        return None

    except Exception:
        return None


def _find_best_match(
    results: list[dict],
    track_name: str,
    artist_name: str,
    min_confidence: float
) -> dict | None:
    """Find the best matching result from a search.

    Args:
        results: List of YouTube Music search results
        track_name: Expected track name
        artist_name: Expected artist name
        min_confidence: Minimum confidence score to accept

    Returns:
        Best match dict or None if no match meets threshold
    """
    if not results:
        return None

    best_result = None
    best_confidence = 0

    for result in results:
        confidence = calculate_confidence(result, track_name, artist_name)
        if confidence > best_confidence:
            best_confidence = confidence
            best_result = result

    if best_result and best_confidence >= min_confidence:
        # Extract artist name
        artists = best_result.get('artists', [])
        artist = artists[0].get('name', '') if artists else ''

        # Extract album name
        album_info = best_result.get('album', {})
        album = album_info.get('name') if isinstance(album_info, dict) else None

        return {
            'videoId': best_result.get('videoId'),
            'title': best_result.get('title'),
            'artist': artist,
            'album': album,
            'confidence': best_confidence,
        }

    return None


def match_tracks(
    ytmusic,
    tracks: list[dict],
    min_confidence: float = 70,
    delay_ms: int = 150,
    progress_callback=None
) -> MatchResult:
    """Match a list of tracks against YouTube Music.

    Processes tracks sequentially with rate limiting to avoid API throttling.

    Args:
        ytmusic: Authenticated YTMusic client
        tracks: List of track dicts with 'name', 'artist', 'album' keys
        min_confidence: Minimum confidence score to accept (0-100)
        delay_ms: Delay between API calls in milliseconds
        progress_callback: Optional callback(current, total, track_name)

    Returns:
        MatchResult with matched, unmatched, total, and match_rate
    """
    matched: list[MatchedTrack] = []
    unmatched: list[UnmatchedTrack] = []
    total = len(tracks)

    if total == 0:
        return {
            'matched': [],
            'unmatched': [],
            'total': 0,
            'match_rate': 0,
        }

    for i, track in enumerate(tracks):
        track_name = track.get('name', '')
        artist_name = track.get('artist', '')

        if progress_callback:
            progress_callback(i + 1, total, track_name)

        try:
            result = search_track(ytmusic, track_name, artist_name, min_confidence)

            if result:
                matched.append({
                    'original': track,
                    'matched': {
                        'videoId': result['videoId'],
                        'title': result['title'],
                        'artist': result['artist'],
                        'album': result.get('album'),
                    },
                    'confidence': result['confidence'],
                })
            else:
                # Determine reason
                # Check if it was low confidence or not found
                # We need to re-check to determine reason
                reason = _determine_unmatched_reason(ytmusic, track_name, artist_name, min_confidence)
                unmatched.append({
                    'original': track,
                    'reason': reason,
                })

        except Exception:
            unmatched.append({
                'original': track,
                'reason': 'api_error',
            })

        # Rate limiting delay (skip for first and last item)
        if delay_ms > 0 and i < total - 1:
            time.sleep(delay_ms / 1000)

    match_rate = len(matched) / total if total > 0 else 0

    return {
        'matched': matched,
        'unmatched': unmatched,
        'total': total,
        'match_rate': match_rate,
    }


def _determine_unmatched_reason(
    ytmusic,
    track_name: str,
    artist_name: str,
    min_confidence: float
) -> str:
    """Determine why a track was unmatched.

    Args:
        ytmusic: Authenticated YTMusic client
        track_name: Track name searched
        artist_name: Artist name searched
        min_confidence: Minimum confidence threshold used

    Returns:
        'not_found', 'low_confidence', or 'api_error'
    """
    try:
        query = f"{artist_name} {track_name}"
        results = ytmusic.search(query, filter='songs', limit=5)

        if not results:
            # Also check title-only search
            results = ytmusic.search(track_name, filter='songs', limit=5)
            if not results:
                return 'not_found'

        # Results exist but none met confidence threshold
        return 'low_confidence'

    except Exception:
        return 'api_error'
