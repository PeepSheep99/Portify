"""Tests for OAuth device flow (DST-01)."""
import pytest
from unittest.mock import patch, MagicMock


class TestDeviceAuthFlow:
    """Test OAuth device code flow."""

    def test_start_device_auth_returns_code(self, mock_oauth_credentials):
        """start_device_auth returns device code and user code."""
        # TODO: Import and call start_device_auth
        # Expected: Returns dict with device_code, user_code, verification_url
        pytest.skip("Waiting for api/youtube_music.py implementation")

    def test_start_device_auth_uses_correct_scopes(self, mock_oauth_credentials):
        """start_device_auth requests YouTube Music scopes."""
        # TODO: Verify SCOPES includes youtube and youtube.readonly
        pytest.skip("Waiting for api/youtube_music.py implementation")

    def test_start_device_auth_returns_verification_url(self, mock_oauth_credentials):
        """start_device_auth includes verification URL for user."""
        # TODO: Verify verification_url is present and valid
        pytest.skip("Waiting for api/youtube_music.py implementation")

    def test_start_device_auth_returns_expiry_info(self, mock_oauth_credentials):
        """start_device_auth includes expires_in and interval."""
        # TODO: Verify timing info for polling
        pytest.skip("Waiting for api/youtube_music.py implementation")


class TestDeviceAuthPolling:
    """Test polling for OAuth completion."""

    def test_poll_device_auth_returns_pending(self, mock_oauth_credentials):
        """poll_device_auth returns pending when user hasn't authorized."""
        # TODO: Mock authorization_pending response
        pytest.skip("Waiting for api/youtube_music.py implementation")

    def test_poll_device_auth_returns_token_on_success(self, mock_oauth_credentials):
        """poll_device_auth returns token when user completes auth."""
        # TODO: Mock successful auth response
        pytest.skip("Waiting for api/youtube_music.py implementation")

    def test_poll_device_auth_handles_expired_code(self, mock_oauth_credentials):
        """poll_device_auth raises error when device code expires."""
        # TODO: Mock expired_token response
        pytest.skip("Waiting for api/youtube_music.py implementation")

    def test_poll_device_auth_respects_interval(self, mock_oauth_credentials):
        """poll_device_auth waits for interval between requests."""
        # TODO: Verify polling respects rate limits
        pytest.skip("Waiting for api/youtube_music.py implementation")

    def test_poll_device_auth_handles_access_denied(self, mock_oauth_credentials):
        """poll_device_auth handles user denying access."""
        # TODO: Mock access_denied response
        pytest.skip("Waiting for api/youtube_music.py implementation")


class TestYTMusicClient:
    """Test YTMusic client creation."""

    def test_get_ytmusic_client_creates_authenticated_instance(self, sample_oauth_token):
        """get_ytmusic_client returns YTMusic instance with auth."""
        # TODO: Verify YTMusic is created with oauth credentials
        pytest.skip("Waiting for api/youtube_music.py implementation")

    def test_get_ytmusic_client_validates_token(self, sample_oauth_token):
        """get_ytmusic_client validates token before returning client."""
        # TODO: Verify token validation occurs
        pytest.skip("Waiting for api/youtube_music.py implementation")

    def test_get_ytmusic_client_handles_invalid_token(self):
        """get_ytmusic_client raises error for invalid token."""
        # TODO: Test with malformed token JSON
        pytest.skip("Waiting for api/youtube_music.py implementation")

    def test_get_ytmusic_client_handles_expired_token(self):
        """get_ytmusic_client handles expired tokens appropriately."""
        # TODO: Test with token that has passed expires_at
        pytest.skip("Waiting for api/youtube_music.py implementation")
