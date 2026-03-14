'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Music, ChevronDown, X, ListMusic } from 'lucide-react';
import type { ParsedPlaylist, ParsedTrack } from '@/types/spotify';

interface PlaylistListProps {
  playlists: ParsedPlaylist[];
  excludedIds?: string[];
  onToggleExclude?: (name: string) => void;
  transferringPlaylist?: ParsedPlaylist | null;
}

// Generate a unique gradient based on string hash
function generateGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 25%), hsl(${hue2}, 60%, 15%))`;
}

function TrackItem({ track, index }: { track: ParsedTrack; index: number }) {
  const gradient = useMemo(() => generateGradient(track.name + track.artist), [track.name, track.artist]);

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className="group flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
    >
      {/* Mini album art placeholder */}
      <div
        className="w-10 h-10 rounded-lg flex-shrink-0"
        style={{ background: gradient }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {track.name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {track.artist}
          {track.album && ` • ${track.album}`}
        </p>
      </div>
    </motion.li>
  );
}

interface PlaylistCardProps {
  playlist: ParsedPlaylist;
  isTransferring?: boolean;
  index: number;
  isExcluded?: boolean;
  onToggleExclude?: () => void;
}

function PlaylistCard({
  playlist,
  isTransferring,
  index,
  isExcluded,
  onToggleExclude,
}: PlaylistCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLikedSongs = playlist.source === 'liked_songs';
  const gradient = useMemo(() => generateGradient(playlist.name), [playlist.name]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 shadow-sm border border-gray-200 ${
        isTransferring ? 'ring-2 ring-blue-400 animate-pulse' : ''
      } ${isExcluded ? 'opacity-50' : ''}`}
    >
      {/* Gradient accent bar */}
      <div className="h-1 gradient-brand" />

      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Album art placeholder */}
          <motion.div
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: gradient }}
            whileHover={{ scale: 1.05 }}
          >
            {isLikedSongs ? (
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white/80" fill="currentColor" />
            ) : (
              <Music className="w-6 h-6 sm:w-8 sm:h-8 text-white/60" />
            )}
          </motion.div>

          {/* Playlist info */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 text-left min-w-0"
          >
            <h3 className={`text-lg font-semibold text-gray-900 truncate ${isExcluded ? 'line-through' : ''}`}>
              {playlist.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">
                {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}
              </span>
              <motion.span
                className="text-gray-400"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </div>
          </button>

          {/* Exclusion X button */}
          {onToggleExclude && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExclude();
              }}
              disabled={isTransferring}
              className={`p-2 rounded-lg transition-colors ${
                isExcluded
                  ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500'
              } ${isTransferring ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={!isTransferring ? { scale: 1.1 } : undefined}
              whileTap={!isTransferring ? { scale: 0.9 } : undefined}
              title={isExcluded ? 'Include playlist' : 'Exclude playlist'}
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Expanded track list */}
        <AnimatePresence>
          {isExpanded && playlist.tracks.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-200">
                <ul className="max-h-64 overflow-y-auto space-y-1 pr-2">
                  {playlist.tracks.map((track, idx) => (
                    <TrackItem
                      key={`${track.name}-${track.artist}-${idx}`}
                      track={track}
                      index={idx}
                    />
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function PlaylistList({
  playlists,
  excludedIds = [],
  onToggleExclude,
  transferringPlaylist,
}: PlaylistListProps) {
  if (playlists.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Music className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500">No playlists loaded</p>
        <p className="mt-1 text-sm text-gray-400">
          Drop your Spotify JSON files above to get started
        </p>
      </motion.div>
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
    <div className="space-y-8 pb-24">
      {/* Liked Songs section */}
      {likedSongs.length > 0 && (
        <section>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Liked Songs
            </h2>
          </motion.div>
          <div className="space-y-4">
            {likedSongs.map((playlist, index) => (
              <PlaylistCard
                key={`liked-${index}`}
                playlist={playlist}
                isTransferring={isPlaylistTransferring(playlist)}
                index={index}
                isExcluded={excludedIds.includes(playlist.name)}
                onToggleExclude={onToggleExclude ? () => onToggleExclude(playlist.name) : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {/* Regular playlists section */}
      {regularPlaylists.length > 0 && (
        <section>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <ListMusic className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Playlists
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
              {regularPlaylists.length}
            </span>
          </motion.div>
          <div className="space-y-4">
            {regularPlaylists.map((playlist, index) => (
              <PlaylistCard
                key={`playlist-${playlist.name}-${index}`}
                playlist={playlist}
                isTransferring={isPlaylistTransferring(playlist)}
                index={index + likedSongs.length}
                isExcluded={excludedIds.includes(playlist.name)}
                onToggleExclude={onToggleExclude ? () => onToggleExclude(playlist.name) : undefined}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
