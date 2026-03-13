"""Portify API - Python serverless functions on Vercel"""
from fastapi import FastAPI

app = FastAPI(
    title="Portify API",
    description="Playlist migration service",
    version="0.1.0"
)


@app.get("/api")
def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "portify", "version": "0.1.0"}


@app.get("/api/hello")
def hello(name: str = "World"):
    """Test endpoint with query parameter"""
    return {"message": f"Hello, {name}!"}
