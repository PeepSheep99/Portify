"""Tests for YouTube Music operations (DST-02, DST-03).

Tests for create_playlist_youtube_api and add_tracks_to_playlist_youtube_api
which use the YouTube Data API directly instead of ytmusicapi.
"""
import pytest
from unittest.mock import patch, MagicMock

from api.youtube_music import create_playlist_youtube_api, add_tracks_to_playlist_youtube_api


class TestPlaylistCreation:
    """Test playlist creation (DST-02)."""

    @patch('api.youtube_music.requests.post')
    def test_create_playlist_returns_playlist_id(self, mock_post):
        """create_playlist_youtube_api returns the new playlist ID."""
        mock_response = MagicMock()
        mock_response.json.return_value = {'id': 'new_playlist_123'}
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = create_playlist_youtube_api('fake_access_token', 'My Playlist')
        assert result == 'new_playlist_123'

    @patch('api.youtube_music.requests.post')
    def test_create_playlist_sets_name_and_description(self, mock_post):
        """create_playlist_youtube_api passes name and description to API."""
        mock_response = MagicMock()
        mock_response.json.return_value = {'id': 'playlist_123'}
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        create_playlist_youtube_api('fake_token', 'Test Playlist', 'My description')

        # Check the request body
        call_args = mock_post.call_args
        body = call_args.kwargs.get('json', call_args[1].get('json'))
        assert body['snippet']['title'] == 'Test Playlist'
        assert body['snippet']['description'] == 'My description'

    @patch('api.youtube_music.requests.post')
    def test_create_playlist_handles_api_error(self, mock_post):
        """create_playlist_youtube_api raises appropriate error on API failure."""
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = Exception("API Error")
        mock_post.return_value = mock_response

        with pytest.raises(Exception, match="API Error"):
            create_playlist_youtube_api('fake_token', 'Test Playlist')

    @patch('api.youtube_music.requests.post')
    def test_create_playlist_with_default_description(self, mock_post):
        """create_playlist_youtube_api uses default description if none provided."""
        mock_response = MagicMock()
        mock_response.json.return_value = {'id': 'playlist_123'}
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        create_playlist_youtube_api('fake_token', 'Test Playlist')

        call_args = mock_post.call_args
        body = call_args.kwargs.get('json', call_args[1].get('json'))
        assert 'Portify' in body['snippet']['description']

    @patch('api.youtube_music.requests.post')
    def test_create_playlist_sanitizes_name(self, mock_post):
        """create_playlist_youtube_api handles special characters in name."""
        mock_response = MagicMock()
        mock_response.json.return_value = {'id': 'playlist_123'}
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = create_playlist_youtube_api('fake_token', 'My "Special" Playlist <3')
        assert result == 'playlist_123'

        # Check title was passed as-is (YouTube API handles escaping)
        call_args = mock_post.call_args
        body = call_args.kwargs.get('json', call_args[1].get('json'))
        assert body['snippet']['title'] == 'My "Special" Playlist <3'


class TestAddTracks:
    """Test adding tracks to playlist (DST-03)."""

    @patch('api.youtube_music.requests.post')
    def test_add_tracks_to_playlist_returns_count(self, mock_post):
        """add_tracks_to_playlist_youtube_api returns number of tracks added."""
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = add_tracks_to_playlist_youtube_api('fake_token', 'playlist_123', ['vid1', 'vid2', 'vid3'])
        assert result == 3

    @patch('api.youtube_music.requests.post')
    def test_add_tracks_sends_correct_api_calls(self, mock_post):
        """add_tracks_to_playlist_youtube_api sends one API call per video."""
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        add_tracks_to_playlist_youtube_api('fake_token', 'playlist_123', ['vid1', 'vid2'])

        # Should be called once per video
        assert mock_post.call_count == 2

        # Check the body structure for the first call
        first_call = mock_post.call_args_list[0]
        body = first_call.kwargs.get('json', first_call[1].get('json'))
        assert body['snippet']['playlistId'] == 'playlist_123'
        assert body['snippet']['resourceId']['kind'] == 'youtube#video'
        assert body['snippet']['resourceId']['videoId'] == 'vid1'

    @patch('api.youtube_music.requests.post')
    def test_add_tracks_handles_partial_failure(self, mock_post):
        """add_tracks_to_playlist_youtube_api handles some tracks failing to add."""
        # First succeeds, second fails, third succeeds
        mock_success = MagicMock()
        mock_success.raise_for_status = MagicMock()

        mock_fail = MagicMock()
        mock_fail.raise_for_status.side_effect = Exception("API Error")

        mock_post.side_effect = [mock_success, mock_fail, mock_success]

        video_ids = ['vid1', 'vid2', 'vid3']
        result = add_tracks_to_playlist_youtube_api('fake_token', 'playlist_123', video_ids)

        # 2 out of 3 succeeded
        assert result == 2

    @patch('api.youtube_music.requests.post')
    def test_add_tracks_adds_all_videos(self, mock_post):
        """add_tracks_to_playlist_youtube_api adds all videos individually."""
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        video_ids = [f'vid{i}' for i in range(10)]
        result = add_tracks_to_playlist_youtube_api('fake_token', 'playlist_123', video_ids)

        assert result == 10
        assert mock_post.call_count == 10

    @patch('api.youtube_music.requests.post')
    def test_add_tracks_returns_zero_for_empty_list(self, mock_post):
        """add_tracks_to_playlist_youtube_api returns 0 for empty track list."""
        result = add_tracks_to_playlist_youtube_api('fake_token', 'playlist_123', [])
        assert result == 0
        mock_post.assert_not_called()

    @patch('api.youtube_music.requests.post')
    def test_add_tracks_handles_rate_limiting(self, mock_post):
        """add_tracks_to_playlist_youtube_api handles API rate limits gracefully."""
        mock_fail = MagicMock()
        mock_fail.raise_for_status.side_effect = Exception("Rate limit exceeded")
        mock_post.return_value = mock_fail

        result = add_tracks_to_playlist_youtube_api('fake_token', 'playlist_123', ['vid1', 'vid2'])
        # Should return 0 when all tracks fail
        assert result == 0


class TestPlaylistOperations:
    """Test combined playlist operations."""

    @patch('api.youtube_music.requests.post')
    def test_create_and_populate_playlist(self, mock_post):
        """Full workflow: create playlist and add tracks."""
        # Set up different responses for create vs add
        def side_effect(*args, **kwargs):
            mock = MagicMock()
            mock.raise_for_status = MagicMock()
            if 'playlists' in args[0]:  # Create playlist URL
                mock.json.return_value = {'id': 'new_playlist_123'}
            return mock

        mock_post.side_effect = side_effect

        playlist_id = create_playlist_youtube_api('fake_token', 'My Playlist')
        assert playlist_id == 'new_playlist_123'

        video_ids = ['vid1', 'vid2', 'vid3']
        added = add_tracks_to_playlist_youtube_api('fake_token', playlist_id, video_ids)
        assert added == 3

    @patch('api.youtube_music.requests.post')
    def test_error_during_add_after_create(self, mock_post):
        """Handle error adding tracks after playlist creation."""
        call_count = [0]

        def side_effect(*args, **kwargs):
            call_count[0] += 1
            mock = MagicMock()
            if call_count[0] == 1:  # First call (create)
                mock.raise_for_status = MagicMock()
                mock.json.return_value = {'id': 'new_playlist_123'}
            else:  # Add calls
                mock.raise_for_status.side_effect = Exception("API Error")
            return mock

        mock_post.side_effect = side_effect

        playlist_id = create_playlist_youtube_api('fake_token', 'My Playlist')
        assert playlist_id == 'new_playlist_123'

        # Adding tracks should fail gracefully
        video_ids = ['vid1', 'vid2']
        added = add_tracks_to_playlist_youtube_api('fake_token', playlist_id, video_ids)
        assert added == 0

    @patch('api.youtube_music.requests.post')
    def test_auth_header_included(self, mock_post):
        """Authorization header is included in all requests."""
        mock_response = MagicMock()
        mock_response.json.return_value = {'id': 'playlist_123'}
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        create_playlist_youtube_api('my_access_token', 'Test Playlist')

        call_args = mock_post.call_args
        headers = call_args.kwargs.get('headers', call_args[1].get('headers'))
        assert headers['Authorization'] == 'Bearer my_access_token'
