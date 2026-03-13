// YouTube Music API client
// Handles OAuth device flow communication with the backend

import type { DeviceAuthResponse, PollAuthResponse } from '@/types/youtube';

const API_BASE = '/api/youtube';

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
