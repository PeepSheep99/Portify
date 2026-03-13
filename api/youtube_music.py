"""YouTube Music API wrapper with OAuth device flow.

This module provides OAuth authentication using Google's device flow,
which is required for the ytmusicapi library. Tokens are returned to
the frontend for storage since Vercel serverless functions are stateless.
"""
import os
import json
import requests
from typing import TypedDict


# Google OAuth endpoints
GOOGLE_DEVICE_AUTH_URL = "https://oauth2.googleapis.com/device/code"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

# Required scopes for YouTube Music access
SCOPES = [
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.readonly"
]


class DeviceAuthResponse(TypedDict):
    """Response from starting device auth flow."""
    device_code: str
    user_code: str
    verification_url: str
    expires_in: int
    interval: int


class PollAuthResult(TypedDict):
    """Result from polling device auth."""
    status: str  # 'pending' | 'complete' | 'error'
    token: str | None  # OAuth token JSON string when complete
    error: str | None  # Error message when error


def get_oauth_credentials() -> tuple[str, str]:
    """Get OAuth credentials from environment variables.

    Returns:
        Tuple of (client_id, client_secret)

    Raises:
        ValueError: If credentials are not configured
    """
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')

    if not client_id or not client_secret:
        raise ValueError(
            "Missing Google OAuth credentials. "
            "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables."
        )

    return client_id, client_secret


def start_device_auth() -> DeviceAuthResponse:
    """Start OAuth device flow for YouTube Music.

    This initiates the device code flow where the user must visit
    a URL and enter a code to authorize the application.

    Returns:
        DeviceAuthResponse with device_code, user_code, verification_url,
        expires_in (seconds), and interval (seconds between polls)

    Raises:
        ValueError: If OAuth credentials are not configured
        requests.RequestException: If Google API request fails
    """
    client_id, _ = get_oauth_credentials()

    response = requests.post(
        GOOGLE_DEVICE_AUTH_URL,
        data={
            'client_id': client_id,
            'scope': ' '.join(SCOPES)
        }
    )
    response.raise_for_status()

    data = response.json()

    return DeviceAuthResponse(
        device_code=data['device_code'],
        user_code=data['user_code'],
        verification_url=data['verification_url'],
        expires_in=data['expires_in'],
        interval=data['interval']
    )


def poll_device_auth(device_code: str) -> PollAuthResult:
    """Poll for OAuth device flow completion.

    This should be called periodically (respecting the interval from
    start_device_auth) to check if the user has completed authorization.

    Args:
        device_code: The device_code from start_device_auth response

    Returns:
        PollAuthResult with:
        - status='pending' if user hasn't completed auth yet
        - status='complete' with token JSON string when successful
        - status='error' with error message on failure

    Raises:
        ValueError: If OAuth credentials are not configured
    """
    client_id, client_secret = get_oauth_credentials()

    response = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            'client_id': client_id,
            'client_secret': client_secret,
            'device_code': device_code,
            'grant_type': 'urn:ietf:params:oauth:grant-type:device_code'
        }
    )

    data = response.json()

    # Check for pending authorization (user hasn't completed flow yet)
    if 'error' in data:
        error = data['error']

        if error == 'authorization_pending':
            return PollAuthResult(status='pending', token=None, error=None)

        if error == 'slow_down':
            # Should poll less frequently
            return PollAuthResult(status='pending', token=None, error=None)

        if error == 'expired_token':
            return PollAuthResult(
                status='error',
                token=None,
                error='Device code expired. Please start a new authentication flow.'
            )

        if error == 'access_denied':
            return PollAuthResult(
                status='error',
                token=None,
                error='Access denied. User did not authorize the application.'
            )

        # Unknown error
        return PollAuthResult(
            status='error',
            token=None,
            error=data.get('error_description', f'Authentication error: {error}')
        )

    # Success - we have the token
    token_data = {
        'access_token': data['access_token'],
        'refresh_token': data.get('refresh_token'),
        'expires_in': data.get('expires_in'),
        'token_type': data.get('token_type', 'Bearer'),
        'scope': data.get('scope')
    }

    return PollAuthResult(
        status='complete',
        token=json.dumps(token_data),
        error=None
    )


def get_ytmusic_client(oauth_token_json: str):
    """Create an authenticated YTMusic client from token JSON.

    Args:
        oauth_token_json: JSON string containing OAuth token data

    Returns:
        Authenticated YTMusic instance

    Raises:
        ValueError: If token JSON is invalid or credentials missing
        ImportError: If ytmusicapi is not installed
    """
    from ytmusicapi import YTMusic, OAuthCredentials

    client_id, client_secret = get_oauth_credentials()

    credentials = OAuthCredentials(
        client_id=client_id,
        client_secret=client_secret
    )

    # YTMusic accepts the token as a JSON string directly
    return YTMusic(oauth_token_json, oauth_credentials=credentials)


def create_playlist(ytmusic, name: str, description: str = "") -> str:
    """Create a new playlist on YouTube Music.

    Args:
        ytmusic: Authenticated YTMusic client
        name: Playlist name
        description: Optional playlist description

    Returns:
        Playlist ID of the newly created playlist

    Raises:
        Exception: If playlist creation fails
    """
    # Use default description if none provided
    if not description:
        description = f"Imported from Spotify using Portify"

    playlist_id = ytmusic.create_playlist(title=name, description=description)
    return playlist_id


def add_tracks_to_playlist(ytmusic, playlist_id: str, video_ids: list[str]) -> int:
    """Add tracks to a YouTube Music playlist.

    Batches requests in groups of 25 to avoid API limits.
    Uses duplicates=True to allow duplicate tracks as recommended in RESEARCH.md.

    Args:
        ytmusic: Authenticated YTMusic client
        playlist_id: Target playlist ID
        video_ids: List of YouTube video IDs to add

    Returns:
        Number of tracks successfully added
    """
    if not video_ids:
        return 0

    added_count = 0
    batch_size = 25

    for i in range(0, len(video_ids), batch_size):
        batch = video_ids[i:i + batch_size]
        try:
            result = ytmusic.add_playlist_items(
                playlistId=playlist_id,
                videoIds=batch,
                duplicates=True
            )
            # add_playlist_items returns dict with status or list
            # on success, count the batch as added
            if result:
                added_count += len(batch)
        except Exception:
            # Continue with remaining batches even if one fails
            pass

    return added_count
