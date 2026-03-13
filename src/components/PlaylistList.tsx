'use client';

import { useState } from 'react';
import type { ParsedPlaylist, ParsedTrack } from '@/types/spotify';

interface PlaylistListProps {
  playlists: ParsedPlaylist[];
  onTransfer?: (playlist: ParsedPlaylist) => void;
  transferringPlaylist?: ParsedPlaylist | null;
}

function TrackItem({ track }: { track: ParsedTrack }) {
  return (
    <li className="py-1 text-sm">
      <span className="font-medium text-zinc-800 dark:text-zinc-200">
        {track.name}
      </span>
      <span className="text-zinc-500 dark:text-zinc-400">
        {' '}
        by {track.artist}
      </span>
      {track.album && (
        <span className="text-zinc-400 dark:text-zinc-500">
          {' '}
          - {track.album}
        </span>
      )}
    </li>
  );
}

interface PlaylistCardProps {
  playlist: ParsedPlaylist;
  onTransfer?: (playlist: ParsedPlaylist) => void;
  isTransferring?: boolean;
}

function PlaylistCard({
  playlist,
  onTransfer,
  isTransferring,
}: PlaylistCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLikedSongs = playlist.source === 'liked_songs';

  const handleTransfer = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding the card
    if (onTransfer) {
      onTransfer(playlist);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-1 items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            {isLikedSongs && (
              <span className="text-red-500" aria-label="Liked Songs">
                &#9829;
              </span>
            )}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {playlist.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {playlist.tracks.length} track
              {playlist.tracks.length !== 1 ? 's' : ''}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">
              {isExpanded ? '\u25B2' : '\u25BC'}
            </span>
          </div>
        </button>

        {/* Transfer button */}
        <button
          onClick={handleTransfer}
          disabled={!onTransfer || isTransferring}
          className={`ml-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            onTransfer && !isTransferring
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500'
          }`}
          title={
            !onTransfer
              ? 'Connect YouTube Music to enable transfer'
              : isTransferring
                ? 'Transfer in progress...'
                : 'Transfer to YouTube Music'
          }
        >
          {isTransferring ? 'Transferring...' : 'Transfer'}
        </button>
      </div>

      {isExpanded && playlist.tracks.length > 0 && (
        <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {playlist.tracks.map((track, index) => (
            <TrackItem
              key={`${track.name}-${track.artist}-${index}`}
              track={track}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export function PlaylistList({
  playlists,
  onTransfer,
  transferringPlaylist,
}: PlaylistListProps) {
  if (playlists.length === 0) {
    return (
      <div className="text-center text-zinc-500 dark:text-zinc-400">
        <p>No playlists loaded</p>
        <p className="mt-1 text-sm">
          Drop your Spotify JSON files above to get started
        </p>
      </div>
    );
  }

  // Separate liked songs from regular playlists
  const likedSongs = playlists.filter((p) => p.source === 'liked_songs');
  const regularPlaylists = playlists.filter((p) => p.source === 'playlist');

  const isPlaylistTransferring = (playlist: ParsedPlaylist) => {
    return (
      transferringPlaylist !== null &&
      transferringPlaylist !== undefined &&
      transferringPlaylist.name === playlist.name
    );
  };

  return (
    <div className="space-y-6">
      {/* Liked Songs section */}
      {likedSongs.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Liked Songs
          </h2>
          <div className="space-y-3">
            {likedSongs.map((playlist, index) => (
              <PlaylistCard
                key={`liked-${index}`}
                playlist={playlist}
                onTransfer={onTransfer}
                isTransferring={isPlaylistTransferring(playlist)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Regular playlists section */}
      {regularPlaylists.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Playlists ({regularPlaylists.length})
          </h2>
          <div className="space-y-3">
            {regularPlaylists.map((playlist, index) => (
              <PlaylistCard
                key={`playlist-${playlist.name}-${index}`}
                playlist={playlist}
                onTransfer={onTransfer}
                isTransferring={isPlaylistTransferring(playlist)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
