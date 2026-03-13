"""Transfer endpoint - separate file for Vercel routing."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional, List
from pydantic import BaseModel

from api.index import transfer_stream_generator

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TrackData(BaseModel):
    name: str
    artist: str
    album: Optional[str] = None


class PlaylistData(BaseModel):
    name: str
    tracks: List[TrackData]


class TransferRequest(BaseModel):
    oauth_token: str
    playlist: PlaylistData


@app.post("/api/transfer")
@app.post("/transfer")
def transfer_playlist(request: TransferRequest):
    """Transfer a playlist from Spotify to YouTube Music."""
    import sys
    print(f"[DEBUG api/transfer.py] REQUEST RECEIVED", file=sys.stderr, flush=True)
    print(f"[DEBUG api/transfer.py] Playlist: {request.playlist.name}", file=sys.stderr, flush=True)
    print(f"[DEBUG api/transfer.py] Tracks: {len(request.playlist.tracks)}", file=sys.stderr, flush=True)
    print(f"[DEBUG api/transfer.py] Token length: {len(request.oauth_token)}", file=sys.stderr, flush=True)
    return StreamingResponse(
        transfer_stream_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Content-Encoding": "none",  # Disable compression which can cause buffering
        }
    )
