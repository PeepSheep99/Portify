"""Tests for track matching logic (MTH-01, MTH-02)."""
import pytest
from unittest.mock import MagicMock

from api.track_matcher import (
    normalize_string,
    calculate_confidence,
    search_track,
    match_tracks,
)


class TestStringNormalization:
    """Test string normalization for matching."""

    def test_normalize_lowercase(self):
        """normalize_string converts to lowercase."""
        assert normalize_string("HELLO") == "hello"
        assert normalize_string("Hello World") == "hello world"

    def test_normalize_strips_accents(self):
        """normalize_string removes accents."""
        assert normalize_string("Cafe") == "cafe"
        assert normalize_string("Beyonce") == "beyonce"
        # Test with actual accented characters
        assert normalize_string("cafe") == "cafe"
        assert normalize_string("naive") == "naive"

    def test_normalize_removes_punctuation(self):
        """normalize_string removes punctuation."""
        assert normalize_string("Don't Stop") == "dont stop"
        assert normalize_string("Rock & Roll") == "rock roll"
        assert normalize_string("Hello, World!") == "hello world"

    def test_normalize_handles_whitespace(self):
        """normalize_string normalizes whitespace."""
        assert normalize_string("  multiple   spaces  ") == "multiple spaces"
        assert normalize_string("tab\there") == "tab here"

    def test_normalize_handles_empty_string(self):
        """normalize_string handles empty string input."""
        assert normalize_string("") == ""

    def test_normalize_handles_unicode(self):
        """normalize_string handles unicode characters properly."""
        assert normalize_string("Motley Crue") == "motley crue"
        assert normalize_string("Bjork") == "bjork"


class TestConfidenceCalculation:
    """Test confidence score calculation."""

    def test_exact_match_high_confidence(self):
        """calculate_confidence returns >95 for exact match."""
        result = {
            'title': 'Bohemian Rhapsody',
            'artists': [{'name': 'Queen'}],
        }
        confidence = calculate_confidence(result, 'Bohemian Rhapsody', 'Queen')
        assert confidence > 95

    def test_partial_artist_match_medium_confidence(self):
        """calculate_confidence returns 70-95 for partial artist match."""
        result = {
            'title': 'Yesterday',
            'artists': [{'name': 'The Beatles'}],
        }
        # "Beatles" vs "The Beatles" - partial match
        confidence = calculate_confidence(result, 'Yesterday', 'Beatles')
        assert 70 <= confidence <= 95

    def test_wrong_artist_low_confidence(self):
        """calculate_confidence returns lower score for wrong artist."""
        result = {
            'title': 'Yesterday',
            'artists': [{'name': 'Metallica'}],
        }
        # Same title, completely different artist
        confidence = calculate_confidence(result, 'Yesterday', 'The Beatles')
        # With exact title (60% * 100 = 60) and wrong artist (40% * ~25 = 10)
        # Should be around 70 or less
        assert confidence <= 75  # Allows some fuzzy match tolerance

    def test_confidence_weights_title_more(self):
        """calculate_confidence weights title 60% and artist 40%."""
        # Same artist, different title
        result_title_mismatch = {
            'title': 'Different Song',
            'artists': [{'name': 'Queen'}],
        }
        # Same title, different artist
        result_artist_mismatch = {
            'title': 'Bohemian Rhapsody',
            'artists': [{'name': 'Different Artist'}],
        }

        conf_title_mismatch = calculate_confidence(result_title_mismatch, 'Bohemian Rhapsody', 'Queen')
        conf_artist_mismatch = calculate_confidence(result_artist_mismatch, 'Bohemian Rhapsody', 'Queen')

        # Title matters more (60% weight), so title mismatch should hurt more
        assert conf_title_mismatch < conf_artist_mismatch

    def test_confidence_handles_missing_artists(self):
        """calculate_confidence works when artists list is empty."""
        result = {
            'title': 'Bohemian Rhapsody',
            'artists': [],
        }
        confidence = calculate_confidence(result, 'Bohemian Rhapsody', 'Queen')
        # Should still calculate based on title alone
        assert confidence > 0

    def test_confidence_clamps_to_100(self):
        """calculate_confidence never exceeds 100."""
        result = {
            'title': 'Test',
            'artists': [{'name': 'Test'}],
        }
        confidence = calculate_confidence(result, 'Test', 'Test')
        assert confidence <= 100

    def test_confidence_minimum_zero(self):
        """calculate_confidence never goes below 0."""
        result = {
            'title': 'XXXXX',
            'artists': [{'name': 'YYYYY'}],
        }
        confidence = calculate_confidence(result, 'ZZZZZ', 'WWWWW')
        assert confidence >= 0


class TestTrackSearch:
    """Test track search functionality (MTH-01)."""

    def test_search_track_returns_best_match(self, mock_ytmusic):
        """search_track returns best matching track with videoId."""
        mock_ytmusic.search.return_value = [
            {
                'videoId': 'abc123',
                'title': 'Bohemian Rhapsody',
                'artists': [{'name': 'Queen'}],
                'album': {'name': 'A Night at the Opera'},
            }
        ]
        result = search_track(mock_ytmusic, 'Bohemian Rhapsody', 'Queen')
        assert result is not None
        assert result['videoId'] == 'abc123'
        assert 'confidence' in result

    def test_search_track_returns_none_when_no_match(self, mock_ytmusic_search_empty):
        """search_track returns None when no results meet threshold."""
        result = search_track(mock_ytmusic_search_empty, 'Unknown Song', 'Unknown Artist')
        assert result is None

    def test_search_track_uses_tiered_search(self, mock_ytmusic):
        """search_track tries artist+title first, then title only."""
        # First search returns nothing, second search returns result
        mock_ytmusic.search.side_effect = [
            [],  # First tier: artist + title returns nothing
            [    # Second tier: title only returns result
                {
                    'videoId': 'xyz789',
                    'title': 'Rare Song',
                    'artists': [{'name': 'Rare Artist'}],
                }
            ]
        ]
        result = search_track(mock_ytmusic, 'Rare Song', 'Rare Artist')
        # Should have made two search calls
        assert mock_ytmusic.search.call_count == 2
        assert result is not None

    def test_search_track_respects_min_confidence(self, mock_ytmusic):
        """search_track filters results below min_confidence threshold."""
        mock_ytmusic.search.return_value = [
            {
                'videoId': 'abc123',
                'title': 'Completely Different Song',
                'artists': [{'name': 'Wrong Artist'}],
            }
        ]
        # With high min_confidence, should return None for poor match
        result = search_track(mock_ytmusic, 'Original Song', 'Original Artist', min_confidence=90)
        assert result is None

    def test_search_track_constructs_query_correctly(self, mock_ytmusic):
        """search_track constructs proper search query from track info."""
        mock_ytmusic.search.return_value = []
        search_track(mock_ytmusic, 'Test Song', 'Test Artist')
        # First call should include both artist and title
        first_call = mock_ytmusic.search.call_args_list[0]
        query = first_call[0][0]  # First positional argument
        assert 'Test Artist' in query
        assert 'Test Song' in query

    def test_search_track_raises_on_api_error(self, mock_ytmusic):
        """search_track raises exception on API errors for caller to handle."""
        mock_ytmusic.search.side_effect = Exception("API Error")
        with pytest.raises(Exception, match="API Error"):
            search_track(mock_ytmusic, 'Test Song', 'Test Artist')

    def test_search_track_limits_results(self, mock_ytmusic):
        """search_track limits API response to reasonable number."""
        mock_ytmusic.search.return_value = []
        search_track(mock_ytmusic, 'Test Song', 'Test Artist')
        # Verify limit parameter was passed
        first_call = mock_ytmusic.search.call_args_list[0]
        kwargs = first_call[1]  # Keyword arguments
        assert 'limit' in kwargs
        assert kwargs['limit'] <= 10


class TestBatchMatching:
    """Test batch track matching (MTH-02)."""

    def test_match_tracks_returns_matched_and_unmatched(self, mock_ytmusic, sample_tracks):
        """match_tracks returns MatchResult with both lists."""
        mock_ytmusic.search.return_value = [
            {
                'videoId': 'vid1',
                'title': 'Bohemian Rhapsody',
                'artists': [{'name': 'Queen'}],
            }
        ]
        result = match_tracks(mock_ytmusic, sample_tracks[:1])
        assert 'matched' in result
        assert 'unmatched' in result
        assert isinstance(result['matched'], list)
        assert isinstance(result['unmatched'], list)

    def test_match_tracks_calculates_match_rate(self, mock_ytmusic, sample_tracks):
        """match_tracks calculates correct match rate percentage."""
        mock_ytmusic.search.return_value = [
            {
                'videoId': 'vid1',
                'title': 'Bohemian Rhapsody',
                'artists': [{'name': 'Queen'}],
            }
        ]
        result = match_tracks(mock_ytmusic, sample_tracks)
        assert 'match_rate' in result
        assert 'total' in result
        expected_rate = len(result['matched']) / result['total'] if result['total'] > 0 else 0
        assert abs(result['match_rate'] - expected_rate) < 0.01

    def test_match_tracks_includes_confidence_scores(self, mock_ytmusic, sample_tracks):
        """match_tracks includes confidence score for each matched track."""
        mock_ytmusic.search.return_value = [
            {
                'videoId': 'vid1',
                'title': 'Bohemian Rhapsody',
                'artists': [{'name': 'Queen'}],
            }
        ]
        result = match_tracks(mock_ytmusic, sample_tracks[:1])
        if result['matched']:
            assert 'confidence' in result['matched'][0]

    def test_match_tracks_handles_empty_list(self, mock_ytmusic):
        """match_tracks handles empty track list."""
        result = match_tracks(mock_ytmusic, [])
        assert result['matched'] == []
        assert result['unmatched'] == []
        assert result['total'] == 0
        assert result['match_rate'] == 0

    def test_match_tracks_preserves_original_track_info(self, mock_ytmusic, sample_tracks):
        """match_tracks includes original track info in results."""
        mock_ytmusic.search.return_value = [
            {
                'videoId': 'vid1',
                'title': 'Bohemian Rhapsody',
                'artists': [{'name': 'Queen'}],
            }
        ]
        result = match_tracks(mock_ytmusic, sample_tracks[:1])
        if result['matched']:
            assert 'original' in result['matched'][0]
            assert result['matched'][0]['original']['name'] == 'Bohemian Rhapsody'

    def test_match_tracks_includes_reason_for_unmatched(self, mock_ytmusic_search_empty, sample_tracks):
        """match_tracks includes failure reason for unmatched tracks."""
        result = match_tracks(mock_ytmusic_search_empty, sample_tracks[:1])
        assert len(result['unmatched']) > 0
        assert 'reason' in result['unmatched'][0]
        assert result['unmatched'][0]['reason'] in ['not_found', 'low_confidence', 'api_error']

    def test_match_tracks_handles_large_playlist(self, mock_ytmusic):
        """match_tracks handles playlists with hundreds of tracks."""
        mock_ytmusic.search.return_value = [
            {
                'videoId': 'vid1',
                'title': 'Test',
                'artists': [{'name': 'Artist'}],
            }
        ]
        large_playlist = [
            {'name': f'Track {i}', 'artist': 'Artist', 'album': 'Album'}
            for i in range(100)
        ]
        # Should not raise an exception
        result = match_tracks(mock_ytmusic, large_playlist, delay_ms=0)  # No delay for test speed
        assert result['total'] == 100


class TestUnmatchedReasons:
    """Test unmatched track reason categorization."""

    def test_reason_not_found_when_no_results(self, mock_ytmusic_search_empty):
        """Unmatched reason is 'not_found' when search returns empty."""
        tracks = [{'name': 'Unknown', 'artist': 'Nobody', 'album': None}]
        result = match_tracks(mock_ytmusic_search_empty, tracks)
        assert result['unmatched'][0]['reason'] == 'not_found'

    def test_reason_low_confidence_when_below_threshold(self, mock_ytmusic):
        """Unmatched reason is 'low_confidence' when no results meet threshold."""
        mock_ytmusic.search.return_value = [
            {
                'videoId': 'vid1',
                'title': 'Completely Different',
                'artists': [{'name': 'Wrong Artist'}],
            }
        ]
        tracks = [{'name': 'Original Song', 'artist': 'Original Artist', 'album': None}]
        result = match_tracks(mock_ytmusic, tracks, min_confidence=95)
        assert len(result['unmatched']) > 0
        assert result['unmatched'][0]['reason'] == 'low_confidence'

    def test_reason_api_error_when_search_fails(self, mock_ytmusic):
        """Unmatched reason is 'api_error' when search throws."""
        mock_ytmusic.search.side_effect = Exception("API Error")
        tracks = [{'name': 'Test', 'artist': 'Test', 'album': None}]
        result = match_tracks(mock_ytmusic, tracks)
        assert result['unmatched'][0]['reason'] == 'api_error'
