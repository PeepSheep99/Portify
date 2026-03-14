'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Music, ChevronDown, X, Check, ListMusic, Disc3 } from 'lucide-react';
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
      transition={{ delay: index * 0.02, duration: 0.15 }}
      className="group flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 transition-all duration-200"
    >
      {/* Track number */}
      <span className="w-5 text-center text-xs text-[var(--text-muted)] font-medium group-hover:text-[var(--accent)]">
        {index + 1}
      </span>

      {/* Mini album art */}
      <div
        className="w-10 h-10 rounded-lg flex-shrink-0 relative overflow-hidden shadow-md"
        style={{ background: gradient }}
      >
        <Music className="w-4 h-4 text-white/70 absolute bottom-1 right-1" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-white transition-colors">
          {track.name}
        </p>
        <p className="text-xs text-[var(--text-muted)] truncate">
          {track.artist}
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
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
        isTransferring ? 'ring-2 ring-[var(--spotify-green)] glow-spotify' : ''
      } ${isExcluded ? 'opacity-40 grayscale' : ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 36, 0.9) 0%, rgba(18, 18, 26, 0.95) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Subtle gradient accent on left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-1 gradient-transfer opacity-70" />

      <div className="p-4 pl-5">
        <div className="flex items-center gap-4">
          {/* Album art with icon */}
          <motion.div
            className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center relative shadow-lg"
            style={{ background: gradient }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {isLikedSongs ? (
              <Heart className="w-7 h-7 text-white drop-shadow-md" fill="currentColor" />
            ) : (
              <Disc3 className="w-7 h-7 text-white/90 drop-shadow-md" />
            )}
            {/* Shine effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </motion.div>

          {/* Playlist info */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 text-left min-w-0"
          >
            <h3 className={`text-base font-semibold text-[var(--text-primary)] truncate ${isExcluded ? 'line-through' : ''}`}>
              {playlist.name}
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-[var(--text-muted)]">
                {playlist.tracks.length} tracks
              </span>
              <motion.span
                className="text-[var(--text-muted)]"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </div>
          </button>

          {/* Toggle include/exclude button */}
          {onToggleExclude && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExclude();
              }}
              disabled={isTransferring}
              className={`p-2 rounded-lg transition-colors ${
                isExcluded
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-[var(--bg-highlight)] text-[var(--text-muted)] hover:bg-red-500/20 hover:text-red-400'
              } ${isTransferring ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={!isTransferring ? { scale: 1.1 } : undefined}
              whileTap={!isTransferring ? { scale: 0.9 } : undefined}
              title={isExcluded ? 'Click to include' : 'Click to exclude'}
            >
              {isExcluded ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
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
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <ul className="max-h-72 overflow-y-auto space-y-1 pr-2">
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
  // Don't render anything if no playlists
  if (playlists.length === 0) {
    return null;
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
    <div className="space-y-6 pb-20">
      {/* Liked Songs section */}
      {likedSongs.length > 0 && (
        <section>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-3"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <Heart className="w-4 h-4 text-[var(--text-primary)]" fill="currentColor" />
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Liked Songs
            </h2>
          </motion.div>
          <div className="space-y-2">
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
            className="flex items-center gap-2 mb-3"
          >
            <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center shadow-md">
              <ListMusic className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Playlists
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent)]/20 text-[var(--accent)]">
              {regularPlaylists.length}
            </span>
          </motion.div>
          <div className="space-y-2">
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
