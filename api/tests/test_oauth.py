"""Tests for OAuth device flow (DST-01)."""
import json
import pytest
from unittest.mock import patch, MagicMock

from api.youtube_music import (
    start_device_auth,
    poll_device_auth,
    get_ytmusic_client_for_search,
    get_access_token,
    get_oauth_credentials,
    SCOPES
)


class TestDeviceAuthFlow:
    """Test OAuth device code flow."""

    @patch('api.youtube_music.requests.post')
    @patch.dict('os.environ', {
        'GOOGLE_CLIENT_ID': 'test_client_id',
        'GOOGLE_CLIENT_SECRET': 'test_client_secret'
    })
    def test_start_device_auth_returns_code(self, mock_post, mock_oauth_credentials):
        """start_device_auth returns device code and user code."""
        mock_post.return_value.json.return_value = mock_oauth_credentials.get_code.return_value
        mock_post.return_value.raise_for_status = MagicMock()

        result = start_device_auth()

        assert 'device_code' in result
        assert 'user_code' in result
        assert result['device_code'] == 'test_device_code'
        assert result['user_code'] == 'TEST-CODE'

    @patch('api.youtube_music.requests.post')
    @patch.dict('os.environ', {
        'GOOGLE_CLIENT_ID': 'test_client_id',
        'GOOGLE_CLIENT_SECRET': 'test_client_secret'
    })
    def test_start_device_auth_uses_correct_scopes(self, mock_post, mock_oauth_credentials):
        """start_device_auth requests YouTube Music scopes."""
        mock_post.return_value.json.return_value = mock_oauth_credentials.get_code.return_value
        mock_post.return_value.raise_for_status = MagicMock()

        start_device_auth()

        # Verify the post was called with correct scopes
        call_args = mock_post.call_args
        assert 'scope' in call_args.kwargs.get('data', call_args[1].get('data', {}))
        scope = call_args.kwargs.get('data', call_args[1].get('data', {}))['scope']
        assert 'youtube' in scope.lower()

    @patch('api.youtube_music.requests.post')
    @patch.dict('os.environ', {
        'GOOGLE_CLIENT_ID': 'test_client_id',
        'GOOGLE_CLIENT_SECRET': 'test_client_secret'
    })
    def test_start_device_auth_returns_verification_url(self, mock_post, mock_oauth_credentials):
        """start_device_auth includes verification URL for user."""
        mock_post.return_value.json.return_value = mock_oauth_credentials.get_code.return_value
        mock_post.return_value.raise_for_status = MagicMock()

        result = start_device_auth()

        assert 'verification_url' in result
        assert result['verification_url'] == 'https://www.google.com/device'

    @patch('api.youtube_music.requests.post')
    @patch.dict('os.environ', {
        'GOOGLE_CLIENT_ID': 'test_client_id',
        'GOOGLE_CLIENT_SECRET': 'test_client_secret'
    })
    def test_start_device_auth_returns_expiry_info(self, mock_post, mock_oauth_credentials):
        """start_device_auth includes expires_in and interval."""
        mock_post.return_value.json.return_value = mock_oauth_credentials.get_code.return_value
        mock_post.return_value.raise_for_status = MagicMock()

        result = start_device_auth()

        assert 'expires_in' in result
        assert 'interval' in result
        assert result['expires_in'] == 1800
        assert result['interval'] == 5


class TestDeviceAuthPolling:
    """Test polling for OAuth completion."""

    @patch('api.youtube_music.requests.post')
    @patch.dict('os.environ', {
        'GOOGLE_CLIENT_ID': 'test_client_id',
        'GOOGLE_CLIENT_SECRET': 'test_client_secret'
    })
    def test_poll_device_auth_returns_pending(self, mock_post, mock_oauth_credentials):
        """poll_device_auth returns pending when user hasn't authorized."""
        mock_post.return_value.json.return_value = {'error': 'authorization_pending'}

        result = poll_device_auth('test_device_code')

        assert result['status'] == 'pending'
        assert result['token'] is None

    @patch('api.youtube_music.requests.post')
    @patch.dict('os.environ', {
        'GOOGLE_CLIENT_ID': 'test_client_id',
        'GOOGLE_CLIENT_SECRET': 'test_client_secret'
    })
    def test_poll_device_auth_returns_token_on_success(self, mock_post, mock_oauth_credentials):
        """poll_device_auth returns token when user completes auth."""
        mock_post.return_value.json.return_value = {
            'access_token': 'test_access_token',
            'refresh_token': 'test_refresh_token',
            'expires_in': 3600,
            'token_type': 'Bearer'
        }

        result = poll_device_auth('test_device_code')

        assert result['status'] == 'complete'
        assert result['token'] is not None
        token_data = json.loads(result['token'])
        assert token_data['access_token'] == 'test_access_token'

    @patch('api.youtube_music.requests.post')
    @patch.dict('os.environ', {
        'GOOGLE_CLIENT_ID': 'test_client_id',
        'GOOGLE_CLIENT_SECRET': 'test_client_secret'
    })
    def test_poll_device_auth_handles_expired_code(self, mock_post, mock_oauth_credentials):
        """poll_device_auth raises error when device code expires."""
        mock_post.return_value.json.return_value = {'error': 'expired_token'}

        result = poll_device_auth('test_device_code')

        assert result['status'] == 'error'
        assert 'expired' in result['error'].lower()

    @patch('api.youtube_music.requests.post')
    @patch.dict('os.environ', {
        'GOOGLE_CLIENT_ID': 'test_client_id',
        'GOOGLE_CLIENT_SECRET': 'test_client_secret'
    })
    def test_poll_device_auth_respects_interval(self, mock_post, mock_oauth_credentials):
        """poll_device_auth handles slow_down response."""
        mock_post.return_value.json.return_value = {'error': 'slow_down'}

        result = poll_device_auth('test_device_code')

        # Should return pending, not error, when told to slow down
        assert result['status'] == 'pending'

    @patch('api.youtube_music.requests.post')
    @patch.dict('os.environ', {
        'GOOGLE_CLIENT_ID': 'test_client_id',
        'GOOGLE_CLIENT_SECRET': 'test_client_secret'
    })
    def test_poll_device_auth_handles_access_denied(self, mock_post, mock_oauth_credentials):
        """poll_device_auth handles user denying access."""
        mock_post.return_value.json.return_value = {'error': 'access_denied'}

        result = poll_device_auth('test_device_code')

        assert result['status'] == 'error'
        assert 'denied' in result['error'].lower()


class TestYTMusicClient:
    """Test YTMusic client creation for search."""

    @patch('ytmusicapi.YTMusic')
    def test_get_ytmusic_client_for_search_creates_unauthenticated_instance(
        self, mock_ytmusic_class
    ):
        """get_ytmusic_client_for_search returns unauthenticated YTMusic instance."""
        mock_ytmusic_instance = MagicMock()
        mock_ytmusic_class.return_value = mock_ytmusic_instance

        result = get_ytmusic_client_for_search()

        # Called with no arguments (unauthenticated mode)
        mock_ytmusic_class.assert_called_once_with()
        assert result == mock_ytmusic_instance


class TestAccessToken:
    """Test access token extraction."""

    def test_get_access_token_extracts_token(self, sample_oauth_token):
        """get_access_token extracts access_token from JSON."""
        result = get_access_token(sample_oauth_token)
        assert result == 'test_access_token'

    def test_get_access_token_handles_invalid_json(self):
        """get_access_token raises error for invalid JSON."""
        with pytest.raises(Exception):
            get_access_token('not-valid-json')

    def test_get_access_token_handles_missing_token(self):
        """get_access_token raises error when access_token missing."""
        with pytest.raises(KeyError):
            get_access_token('{"refresh_token": "test"}')


class TestOAuthCredentials:
    """Test OAuth credentials retrieval."""

    @patch.dict('os.environ', {
        'GOOGLE_CLIENT_ID': 'my_client_id',
        'GOOGLE_CLIENT_SECRET': 'my_client_secret'
    })
    def test_get_oauth_credentials_returns_tuple(self):
        """get_oauth_credentials returns client_id and client_secret."""
        client_id, client_secret = get_oauth_credentials()

        assert client_id == 'my_client_id'
        assert client_secret == 'my_client_secret'

    @patch.dict('os.environ', {}, clear=True)
    def test_get_oauth_credentials_raises_without_credentials(self):
        """get_oauth_credentials raises ValueError when not configured."""
        with pytest.raises(ValueError, match='Missing Google OAuth credentials'):
            get_oauth_credentials()

    @patch.dict('os.environ', {'GOOGLE_CLIENT_ID': 'id_only'}, clear=True)
    def test_get_oauth_credentials_raises_without_secret(self):
        """get_oauth_credentials raises ValueError when secret missing."""
        with pytest.raises(ValueError, match='Missing Google OAuth credentials'):
            get_oauth_credentials()
