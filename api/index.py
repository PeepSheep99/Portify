"""Portify API - Python serverless functions on Vercel"""
import json
import time
import logging
import sys
from typing import Generator, Optional, List
from pathlib import Path

from dotenv import load_dotenv

# Configure logging to stdout with immediate flush
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)
# Load .env.local for local development
load_dotenv(Path(__file__).parent.parent / ".env.local")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.youtube_music import (
    start_device_auth,
    poll_device_auth,
    get_ytmusic_client_for_search,
    get_access_token,
    create_playlist_youtube_api,
    add_tracks_to_playlist_youtube_api,
)
from api.track_matcher import match_tracks

app = FastAPI(
    title="Portify API",
    description="Playlist migration service",
    version="0.1.0"
)

# Add CORS middleware for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api")
def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "portify", "version": "0.1.0"}


@app.get("/api/hello")
def hello(name: str = "World"):
    """Test endpoint with query parameter"""
    return {"message": f"Hello, {name}!"}


# YouTube Music OAuth endpoints

@app.post("/api/youtube/auth/start")
def youtube_auth_start():
    """Start OAuth device flow for YouTube Music.

    Returns device code info that the user must enter at the verification URL.

    Returns:
        DeviceAuthResponse with device_code, user_code, verification_url,
        expires_in, and interval for polling.
    """
    try:
        result = start_device_auth()
        return result
    except ValueError as e:
        # Missing credentials
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start auth: {str(e)}")


class PollAuthRequest(BaseModel):
    """Request body for polling device auth."""
    device_code: str


@app.post("/api/youtube/auth/poll")
def youtube_auth_poll(request: PollAuthRequest):
    """Poll for OAuth device flow completion.

    Should be called at the interval specified by /auth/start response.

    Args:
        device_code: The device_code from the start response

    Returns:
        - status='pending' if user hasn't completed auth yet
        - status='complete' with token JSON string when successful
        - status='error' with error message on failure
    """
    try:
        result = poll_device_auth(request.device_code)
        return result
    except ValueError as e:
        # Missing credentials
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to poll auth: {str(e)}")


# Transfer endpoint

class TrackData(BaseModel):
    """Track data for transfer."""
    name: str
    artist: str
    album: Optional[str] = None


class PlaylistData(BaseModel):
    """Playlist data for transfer."""
    name: str
    tracks: List[TrackData]


class TransferRequest(BaseModel):
    """Request body for playlist transfer."""
    oauth_token: str
    playlist: PlaylistData


def transfer_stream_generator(request: TransferRequest) -> Generator[str, None, None]:
    """Generate SSE events for playlist transfer.

    Streams progress updates as JSON lines prefixed with 'data: '.

    Phases:
    1. matching - Search for each track on YouTube Music
    2. creating - Create the playlist
    3. adding - Add matched tracks to playlist
    """
    logger.info("START transfer_stream_generator")
    logger.info(f"Playlist name: {request.playlist.name}")
    logger.info(f"Track count: {len(request.playlist.tracks)}")
    logger.info(f"oauth_token (first 50 chars): {request.oauth_token[:50]}...")

    try:
        # Extract access token for YouTube Data API calls
        access_token = get_access_token(request.oauth_token)
        logger.info("Access token extracted")

        # Create unauthenticated YTMusic client for search
        # (YouTube Music API doesn't accept TV OAuth tokens, but search works without auth)
        logger.info("Creating unauthenticated YTMusic client for search...")
        ytmusic = get_ytmusic_client_for_search()
        logger.info("YTMusic client created successfully")

        # Convert tracks to dict format for matcher
        tracks = [
            {'name': t.name, 'artist': t.artist, 'album': t.album}
            for t in request.playlist.tracks
        ]
        total_tracks = len(tracks)

        # Phase 1: Match tracks with progress callback
        matched_tracks = []
        unmatched_tracks = []

        def progress_callback(current: int, total: int, track_name: str):
            event = {
                'phase': 'matching',
                'current': current,
                'total': total,
                'currentTrack': track_name,
                'status': 'in_progress'
            }
            # Yield but we need to collect matches too
            # Note: callback is synchronous so we send event here
            nonlocal matched_tracks, unmatched_tracks
            # Events are yielded from outer generator

        # For streaming, we need to match one at a time
        for i, track in enumerate(tracks):
            # Send progress event
            yield f"data: {json.dumps({'phase': 'matching', 'current': i + 1, 'total': total_tracks, 'currentTrack': track['name'], 'status': 'in_progress'})}\n\n"
            # Force I/O flush for real-time streaming
            sys.stderr.flush()
            time.sleep(0.01)  # 10ms - forces context switch for I/O

            # Match single track (use match_tracks with single item)
            from api.track_matcher import search_track
            logger.info(f"Searching track {i+1}/{total_tracks}: {track['name']} by {track['artist']}")
            try:
                result = search_track(ytmusic, track['name'], track['artist'])
                logger.info(f"Search result: {'FOUND' if result else 'NOT FOUND'}")
            except Exception as search_err:
                logger.error(f"Search EXCEPTION: {type(search_err).__name__}: {search_err}")
                import traceback
                logger.error(traceback.format_exc())
                raise

            if result:
                matched_tracks.append({
                    'original': track,
                    'matched': {
                        'videoId': result['videoId'],
                        'title': result['title'],
                        'artist': result['artist'],
                        'album': result.get('album'),
                    },
                    'confidence': result['confidence']
                })
            else:
                unmatched_tracks.append({
                    'original': track,
                    'reason': 'not_found'
                })

            # Rate limiting delay (150ms as per RESEARCH.md)
            if i < total_tracks - 1:
                time.sleep(0.15)

        # Phase 2: Create playlist using YouTube Data API
        yield f"data: {json.dumps({'phase': 'creating', 'current': 0, 'total': 0, 'status': 'in_progress'})}\n\n"
        # Force I/O flush for real-time streaming
        sys.stderr.flush()
        time.sleep(0.01)

        logger.info("Creating playlist via YouTube Data API...")
        playlist_id = create_playlist_youtube_api(access_token, request.playlist.name)
        logger.info(f"Playlist created: {playlist_id}")

        # Phase 3: Add tracks using YouTube Data API
        video_ids = [t['matched']['videoId'] for t in matched_tracks]
        total_to_add = len(video_ids)

        if total_to_add > 0:
            logger.info(f"Adding {total_to_add} tracks to playlist...")
            added_count = 0

            for i, video_id in enumerate(video_ids):
                try:
                    add_tracks_to_playlist_youtube_api(access_token, playlist_id, [video_id])
                    added_count += 1
                except Exception as e:
                    logger.warning(f"Failed to add video {video_id}: {e}")
                    # Continue with remaining tracks

                # Send progress update every track
                yield f"data: {json.dumps({'phase': 'adding', 'current': i + 1, 'total': total_to_add, 'status': 'in_progress'})}\n\n"
                # Force I/O flush for real-time streaming
                sys.stderr.flush()
                time.sleep(0.01)

            logger.info(f"Added {added_count}/{total_to_add} tracks")

        # Build match result
        match_rate = len(matched_tracks) / total_tracks if total_tracks > 0 else 0
        match_result = {
            'matched': matched_tracks,
            'unmatched': unmatched_tracks,
            'total': total_tracks,
            'matchRate': match_rate
        }

        # Final result
        transfer_result = {
            'playlistId': playlist_id,
            'playlistName': request.playlist.name,
            'tracksAdded': len(matched_tracks),
            'tracksFailed': len(unmatched_tracks),
            'matchResult': match_result
        }

        yield f"data: {json.dumps({'status': 'complete', 'result': transfer_result})}\n\n"
        # Force I/O flush for real-time streaming
        sys.stderr.flush()
        time.sleep(0.01)

    except Exception as e:
        logger.error(f"FATAL EXCEPTION: {type(e).__name__}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        yield f"data: {json.dumps({'status': 'error', 'error': str(e)})}\n\n"
        # Force I/O flush for real-time streaming
        sys.stderr.flush()
        time.sleep(0.01)


@app.post("/api/transfer")
def transfer_playlist(request: TransferRequest):
    """Transfer a playlist from Spotify to YouTube Music.

    Streams progress updates via Server-Sent Events.

    Request body:
        oauth_token: OAuth token JSON string from device flow
        playlist: Playlist data with name and tracks

    Response: SSE stream with progress events
    """
    logger.info("=" * 50)
    logger.info("REQUEST RECEIVED: /api/transfer")
    logger.info(f"Playlist: {request.playlist.name}")
    logger.info(f"Tracks: {len(request.playlist.tracks)}")
    logger.info(f"Token length: {len(request.oauth_token)}")
    logger.info("=" * 50)

    return StreamingResponse(
        transfer_stream_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
            "Content-Encoding": "none",  # Disable compression which can cause buffering
        }
    )
