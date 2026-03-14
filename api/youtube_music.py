"""YouTube Music API wrapper with OAuth device flow.

This module provides OAuth authentication using Google's device flow,
which is required for the ytmusicapi library. Tokens are returned to
the frontend for storage since Vercel serverless functions are stateless.
"""
import os
import json
import logging
import requests
from typing import TypedDict, Optional, Tuple, List

logger = logging.getLogger(__name__)


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
    token: Optional[str]  # OAuth token JSON string when complete
    error: Optional[str]  # Error message when error


def get_oauth_credentials() -> Tuple[str, str]:
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


def get_ytmusic_client_for_search():
    """Create an unauthenticated YTMusic client for search operations.

    YouTube Music's internal API doesn't accept OAuth tokens from TV-type clients,
    so we use unauthenticated mode for search (which works fine).

    Returns:
        Unauthenticated YTMusic instance for search operations
    """
    from ytmusicapi import YTMusic
    logger.info("Creating unauthenticated YTMusic client for search...")
    return YTMusic()


def get_access_token(oauth_token_json: str) -> str:
    """Extract access token from OAuth token JSON.

    Args:
        oauth_token_json: JSON string containing OAuth token data

    Returns:
        Access token string
    """
    token_data = json.loads(oauth_token_json)
    return token_data['access_token']


def validate_oauth_token(oauth_token_json: str) -> bool:
    """Validate an OAuth token by making a lightweight API call.

    Calls the YouTube channels endpoint to check if the token is valid.

    Args:
        oauth_token_json: JSON string containing OAuth token data

    Returns:
        True if token is valid, False otherwise
    """
    try:
        access_token = get_access_token(oauth_token_json)

        # Make a lightweight API call to check token validity
        url = "https://www.googleapis.com/youtube/v3/channels"
        params = {"part": "id", "mine": "true"}
        headers = {"Authorization": f"Bearer {access_token}"}

        response = requests.get(url, params=params, headers=headers)

        # 200 = valid, 401 = invalid/expired
        return response.status_code == 200
    except Exception as e:
        logger.warning(f"Token validation failed: {e}")
        return False


def create_playlist_youtube_api(access_token: str, name: str, description: str = "") -> str:
    """Create a new playlist using YouTube Data API.

    YouTube Music's internal API doesn't accept OAuth tokens from TV-type clients,
    so we use the YouTube Data API instead (which works with any OAuth token).

    Args:
        access_token: OAuth access token
        name: Playlist name
        description: Optional playlist description

    Returns:
        Playlist ID of the newly created playlist

    Raises:
        Exception: If playlist creation fails
    """
    import traceback

    if not description:
        description = "Imported from Spotify using Portify"

    logger.info(f"Creating playlist via YouTube Data API: {name}")

    url = "https://www.googleapis.com/youtube/v3/playlists"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    body = {
        "snippet": {
            "title": name,
            "description": description
        },
        "status": {
            "privacyStatus": "private"
        }
    }

    try:
        response = requests.post(url, headers=headers, json=body, params={"part": "snippet,status"})
        response.raise_for_status()
        data = response.json()
        playlist_id = data.get('id')
        logger.info(f"Created playlist: {playlist_id}")
        return playlist_id
    except requests.exceptions.HTTPError as e:
        logger.error(f"Playlist creation failed: {e}")
        logger.error(f"Response: {e.response.text if e.response else 'No response'}")
        logger.error(traceback.format_exc())
        raise
    except Exception as e:
        logger.error(f"Playlist creation failed: {type(e).__name__}: {e}")
        logger.error(traceback.format_exc())
        raise


def add_tracks_to_playlist_youtube_api(access_token: str, playlist_id: str, video_ids: List[str]) -> int:
    """Add tracks to a YouTube playlist using YouTube Data API.

    Args:
        access_token: OAuth access token
        playlist_id: Target playlist ID
        video_ids: List of YouTube video IDs to add

    Returns:
        Number of tracks successfully added
    """
    if not video_ids:
        return 0

    url = "https://www.googleapis.com/youtube/v3/playlistItems"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    added_count = 0
    for video_id in video_ids:
        body = {
            "snippet": {
                "playlistId": playlist_id,
                "resourceId": {
                    "kind": "youtube#video",
                    "videoId": video_id
                }
            }
        }

        try:
            response = requests.post(url, headers=headers, json=body, params={"part": "snippet"})
            response.raise_for_status()
            added_count += 1
            logger.info(f"Added video {video_id} to playlist")
        except requests.exceptions.HTTPError as e:
            logger.warning(f"Failed to add video {video_id}: {e}")
            # Continue with remaining videos
        except Exception as e:
            logger.warning(f"Failed to add video {video_id}: {type(e).__name__}: {e}")
            # Continue with remaining videos

    return added_count


# Keep old function names for backwards compatibility
def create_playlist(ytmusic_or_token, name: str, description: str = "") -> str:
    """Create playlist - wrapper for backwards compatibility."""
    if isinstance(ytmusic_or_token, str):
        # It's an access token
        return create_playlist_youtube_api(ytmusic_or_token, name, description)
    else:
        # It's a YTMusic instance - shouldn't happen with new code
        raise ValueError("YTMusic instance no longer supported - pass access_token instead")


def add_tracks_to_playlist(ytmusic_or_token, playlist_id: str, video_ids: List[str]) -> int:
    """Add tracks to playlist - wrapper for backwards compatibility."""
    if isinstance(ytmusic_or_token, str):
        return add_tracks_to_playlist_youtube_api(ytmusic_or_token, playlist_id, video_ids)
    else:
        raise ValueError("YTMusic instance no longer supported - pass access_token instead")
