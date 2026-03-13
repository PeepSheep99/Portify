// YouTube Music API Types
// Used for OAuth device flow and track operations

/**
 * Response from starting OAuth device flow.
 * User must visit verification_url and enter user_code.
 */
export interface DeviceAuthResponse {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number; // seconds until device_code expires
  interval: number; // seconds between poll attempts
}

/**
 * Current authentication status in the UI.
 */
export type AuthStatus = 'disconnected' | 'pending' | 'connected';

/**
 * OAuth token data stored after successful authentication.
 */
export interface OAuthToken {
  access_token: string;
  refresh_token: string | null;
  expires_in: number;
  token_type: string;
  scope?: string;
}

/**
 * Poll response from /api/youtube/auth/poll endpoint.
 */
export interface PollAuthResponse {
  status: 'pending' | 'complete' | 'error';
  token?: string; // JSON string of OAuthToken when complete
  error?: string; // Error message when status is 'error'
}

/**
 * YouTube Music track from search results.
 */
export interface YouTubeTrack {
  videoId: string;
  title: string;
  artist: string;
  album?: string;
}
