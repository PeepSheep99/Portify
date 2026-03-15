// Transfer Types
// Used for track matching and playlist transfer operations

import type { ParsedTrack } from './spotify';
import type { YouTubeTrack } from './youtube';

/**
 * A track that was successfully matched on YouTube Music.
 */
export interface MatchedTrack {
  original: ParsedTrack;
  matched: YouTubeTrack;
  confidence: number; // 0-100 match confidence score
}

/**
 * A track that could not be matched on YouTube Music.
 */
export interface UnmatchedTrack {
  original: ParsedTrack;
  reason: 'not_found' | 'low_confidence';
}

/**
 * Result of batch track matching operation.
 */
export interface MatchResult {
  matched: MatchedTrack[];
  unmatched: UnmatchedTrack[];
  total: number;
  matchRate: number; // 0-1 percentage of tracks matched
}

/**
 * Progress update for transfer operations (SSE streaming).
 */
export interface TransferProgress {
  current: number;
  total: number;
  phase: 'matching' | 'creating' | 'adding';
  currentTrack?: string;
  status: 'in_progress' | 'complete' | 'error';
  error?: string;
}

/**
 * Final result of a playlist transfer operation.
 */
export interface TransferResult {
  playlistId?: string;
  playlistName: string;
  tracksAdded: number;
  tracksFailed: number;
  matchResult?: MatchResult;
  // For skipped playlists
  skipped?: boolean;
  reason?: string;
  playlist_name?: string; // Backend uses snake_case
}

/**
 * Aggregated result for batch playlist transfers.
 */
export interface BatchTransferResult {
  results: TransferResult[];
  totalPlaylists: number;
  created: number;
  skipped: number;
  failed: number;
}
