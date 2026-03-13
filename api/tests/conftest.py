"""Pytest fixtures for YouTube Music API testing."""
import json
import pytest
from unittest.mock import MagicMock, AsyncMock


@pytest.fixture
def mock_ytmusic():
    """Mock YTMusic client for testing without real API calls."""
    mock = MagicMock()
    # Default search response
    mock.search.return_value = [
        {
            'videoId': 'abc123',
            'title': 'Test Song',
            'artists': [{'name': 'Test Artist'}],
            'album': {'name': 'Test Album'}
        }
    ]
    # Default playlist creation response
    mock.create_playlist.return_value = 'playlist_id_123'
    mock.add_playlist_items.return_value = {'status': 'STATUS_SUCCEEDED'}
    return mock


@pytest.fixture
def mock_oauth_credentials():
    """Mock OAuth credentials for testing device flow."""
    mock = MagicMock()
    mock.get_code.return_value = {
        'device_code': 'test_device_code',
        'user_code': 'TEST-CODE',
        'verification_url': 'https://www.google.com/device',
        'expires_in': 1800,
        'interval': 5
    }
    return mock


@pytest.fixture
def sample_tracks():
    """Sample Spotify tracks for testing matching."""
    return [
        {'name': 'Bohemian Rhapsody', 'artist': 'Queen', 'album': 'A Night at the Opera'},
        {'name': 'Hotel California', 'artist': 'Eagles', 'album': 'Hotel California'},
        {'name': 'Stairway to Heaven', 'artist': 'Led Zeppelin', 'album': 'Led Zeppelin IV'},
    ]


@pytest.fixture
def sample_oauth_token():
    """Sample OAuth token JSON for testing authenticated calls."""
    return json.dumps({
        'access_token': 'test_access_token',
        'refresh_token': 'test_refresh_token',
        'expires_at': 9999999999,
        'token_type': 'Bearer'
    })


@pytest.fixture
def mock_ytmusic_search_empty():
    """Mock YTMusic client that returns no search results."""
    mock = MagicMock()
    mock.search.return_value = []
    return mock


@pytest.fixture
def mock_ytmusic_search_multiple():
    """Mock YTMusic client with multiple search results."""
    mock = MagicMock()
    mock.search.return_value = [
        {
            'videoId': 'vid1',
            'title': 'Bohemian Rhapsody',
            'artists': [{'name': 'Queen'}],
            'album': {'name': 'A Night at the Opera'}
        },
        {
            'videoId': 'vid2',
            'title': 'Bohemian Rhapsody (Remastered)',
            'artists': [{'name': 'Queen'}],
            'album': {'name': 'Greatest Hits'}
        },
        {
            'videoId': 'vid3',
            'title': 'Bohemian Rhapsody (Live)',
            'artists': [{'name': 'Queen'}],
            'album': {'name': 'Live Killers'}
        },
    ]
    return mock
