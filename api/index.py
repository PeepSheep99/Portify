"""Portify API - Python serverless functions on Vercel"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from api.youtube_music import start_device_auth, poll_device_auth

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
