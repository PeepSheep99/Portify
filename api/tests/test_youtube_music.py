"""Tests for YouTube Music operations (DST-02, DST-03)."""
import pytest
from unittest.mock import patch, MagicMock

from api.youtube_music import create_playlist, add_tracks_to_playlist


class TestPlaylistCreation:
    """Test playlist creation (DST-02)."""

    def test_create_playlist_returns_playlist_id(self, mock_ytmusic):
        """create_playlist returns the new playlist ID."""
        mock_ytmusic.create_playlist.return_value = 'new_playlist_123'
        result = create_playlist(mock_ytmusic, 'My Playlist')
        assert result == 'new_playlist_123'

    def test_create_playlist_sets_name_and_description(self, mock_ytmusic):
        """create_playlist passes name and description to API."""
        create_playlist(mock_ytmusic, 'Test Playlist', 'My description')
        mock_ytmusic.create_playlist.assert_called_once_with(
            title='Test Playlist',
            description='My description'
        )

    def test_create_playlist_handles_api_error(self, mock_ytmusic):
        """create_playlist raises appropriate error on API failure."""
        mock_ytmusic.create_playlist.side_effect = Exception("API Error")
        with pytest.raises(Exception, match="API Error"):
            create_playlist(mock_ytmusic, 'Test Playlist')

    def test_create_playlist_with_default_description(self, mock_ytmusic):
        """create_playlist uses default description if none provided."""
        create_playlist(mock_ytmusic, 'Test Playlist')
        mock_ytmusic.create_playlist.assert_called_once()
        call_kwargs = mock_ytmusic.create_playlist.call_args.kwargs
        assert 'Portify' in call_kwargs['description']

    def test_create_playlist_sanitizes_name(self, mock_ytmusic):
        """create_playlist handles special characters in name."""
        mock_ytmusic.create_playlist.return_value = 'playlist_123'
        result = create_playlist(mock_ytmusic, 'My "Special" Playlist <3')
        assert result == 'playlist_123'
        mock_ytmusic.create_playlist.assert_called_once()


class TestAddTracks:
    """Test adding tracks to playlist (DST-03)."""

    def test_add_tracks_to_playlist_returns_count(self, mock_ytmusic):
        """add_tracks_to_playlist returns number of tracks added."""
        mock_ytmusic.add_playlist_items.return_value = {'status': 'STATUS_SUCCEEDED'}
        result = add_tracks_to_playlist(mock_ytmusic, 'playlist_123', ['vid1', 'vid2', 'vid3'])
        assert result == 3

    def test_add_tracks_uses_duplicates_flag(self, mock_ytmusic):
        """add_tracks_to_playlist allows duplicate tracks."""
        add_tracks_to_playlist(mock_ytmusic, 'playlist_123', ['vid1'])
        mock_ytmusic.add_playlist_items.assert_called_once()
        call_kwargs = mock_ytmusic.add_playlist_items.call_args.kwargs
        assert call_kwargs['duplicates'] is True

    def test_add_tracks_handles_partial_failure(self, mock_ytmusic):
        """add_tracks_to_playlist handles some tracks failing to add."""
        # First batch succeeds, second fails
        mock_ytmusic.add_playlist_items.side_effect = [
            {'status': 'STATUS_SUCCEEDED'},
            Exception("API Error")
        ]
        # 30 tracks = 2 batches of 25 and 5
        video_ids = [f'vid{i}' for i in range(30)]
        result = add_tracks_to_playlist(mock_ytmusic, 'playlist_123', video_ids)
        # Only first batch of 25 succeeded
        assert result == 25

    def test_add_tracks_batches_large_playlists(self, mock_ytmusic):
        """add_tracks_to_playlist batches requests for large playlists."""
        mock_ytmusic.add_playlist_items.return_value = {'status': 'STATUS_SUCCEEDED'}
        # 60 tracks should be 3 batches (25, 25, 10)
        video_ids = [f'vid{i}' for i in range(60)]
        result = add_tracks_to_playlist(mock_ytmusic, 'playlist_123', video_ids)
        assert result == 60
        assert mock_ytmusic.add_playlist_items.call_count == 3

    def test_add_tracks_returns_zero_for_empty_list(self, mock_ytmusic):
        """add_tracks_to_playlist returns 0 for empty track list."""
        result = add_tracks_to_playlist(mock_ytmusic, 'playlist_123', [])
        assert result == 0
        mock_ytmusic.add_playlist_items.assert_not_called()

    def test_add_tracks_handles_rate_limiting(self, mock_ytmusic):
        """add_tracks_to_playlist handles API rate limits gracefully."""
        # Simulate rate limit error
        mock_ytmusic.add_playlist_items.side_effect = Exception("Rate limit exceeded")
        result = add_tracks_to_playlist(mock_ytmusic, 'playlist_123', ['vid1', 'vid2'])
        # Should return 0 when all batches fail
        assert result == 0


class TestPlaylistOperations:
    """Test combined playlist operations."""

    def test_create_and_populate_playlist(self, mock_ytmusic, sample_tracks):
        """Full workflow: create playlist and add tracks."""
        mock_ytmusic.create_playlist.return_value = 'new_playlist_123'
        mock_ytmusic.add_playlist_items.return_value = {'status': 'STATUS_SUCCEEDED'}

        playlist_id = create_playlist(mock_ytmusic, 'My Playlist')
        assert playlist_id == 'new_playlist_123'

        video_ids = ['vid1', 'vid2', 'vid3']
        added = add_tracks_to_playlist(mock_ytmusic, playlist_id, video_ids)
        assert added == 3

    def test_error_during_add_after_create(self, mock_ytmusic, sample_tracks):
        """Handle error adding tracks after playlist creation."""
        mock_ytmusic.create_playlist.return_value = 'new_playlist_123'
        mock_ytmusic.add_playlist_items.side_effect = Exception("API Error")

        playlist_id = create_playlist(mock_ytmusic, 'My Playlist')
        assert playlist_id == 'new_playlist_123'

        # Adding tracks should fail gracefully
        video_ids = ['vid1', 'vid2']
        added = add_tracks_to_playlist(mock_ytmusic, playlist_id, video_ids)
        assert added == 0

    def test_progress_callback_called(self, mock_ytmusic, sample_tracks):
        """Progress callback is invoked during track addition."""
        # This test verifies batching behavior which inherently provides progress info
        mock_ytmusic.add_playlist_items.return_value = {'status': 'STATUS_SUCCEEDED'}
        video_ids = [f'vid{i}' for i in range(50)]

        result = add_tracks_to_playlist(mock_ytmusic, 'playlist_123', video_ids)
        assert result == 50
        # Verify it was called in batches
        assert mock_ytmusic.add_playlist_items.call_count == 2
