// YouTube Music API client
// Handles OAuth device flow communication with the backend

import type { DeviceAuthResponse, PollAuthResponse } from '@/types/youtube';
import type { ParsedPlaylist } from '@/types/spotify';
import type { TransferProgress, TransferResult } from '@/types/transfer';

const API_BASE = '/api/youtube';

/**
 * Error thrown when OAuth token is invalid or expired.
 * Callers should clear the stored token and prompt for re-authentication.
 */
export class AuthError extends Error {
  constructor(message: string = 'Authentication expired. Please reconnect.') {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Start the OAuth device flow.
 * Returns device code info that user must enter at the verification URL.
 */
export async function startAuth(): Promise<DeviceAuthResponse> {
  const response = await fetch(`${API_BASE}/auth/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to start authentication');
  }

  return response.json();
}

/**
 * Poll for OAuth completion status.
 * Should be called at the interval specified in DeviceAuthResponse.
 */
export async function pollAuth(deviceCode: string): Promise<PollAuthResponse> {
  const response = await fetch(`${API_BASE}/auth/poll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ device_code: deviceCode }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to poll authentication');
  }

  return response.json();
}

/**
 * Transfer a playlist to YouTube Music.
 * Streams progress updates via SSE and returns the final result.
 */
export async function transferPlaylist(
  token: string,
  playlist: ParsedPlaylist,
  onProgress: (data: TransferProgress) => void
): Promise<TransferResult> {
  const requestBody = {
    oauth_token: token,
    playlist: {
      name: playlist.name,
      tracks: playlist.tracks.map((t) => ({
        name: t.name,
        artist: t.artist,
        album: t.album,
      })),
    },
  };

  const response = await fetch('/api/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      throw new AuthError('Your session has expired. Please reconnect to YouTube Music.');
    }

    const errorText = await response.text();
    let error;
    try {
      error = JSON.parse(errorText);
    } catch {
      error = { detail: errorText || 'Unknown error' };
    }
    throw new Error(error.detail || 'Failed to start transfer');
  }

  // Read SSE stream
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let result: TransferResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE events (lines ending with \n\n)
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6); // Remove "data: " prefix
        try {
          const data = JSON.parse(jsonStr);

          if (data.status === 'complete' && data.result) {
            result = data.result;
          } else if (data.status === 'error') {
            throw new Error(data.error || 'Transfer failed');
          } else {
            // Progress update
            onProgress({
              current: data.current || 0,
              total: data.total || 0,
              phase: data.phase || 'matching',
              currentTrack: data.currentTrack,
              status: data.status || 'in_progress',
              error: data.error,
            });
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Transfer failed') {
            console.error('Failed to parse SSE event:', e);
          } else {
            throw e;
          }
        }
      }
    }
  }

  if (!result) {
    throw new Error('Transfer did not complete successfully');
  }

  return result;
}
