'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Music, ChevronDown, ArrowRight, Loader2, ListMusic } from 'lucide-react';
import { Checkbox } from '@/components/ui';
import type { ParsedPlaylist, ParsedTrack } from '@/types/spotify';

interface PlaylistListProps {
  playlists: ParsedPlaylist[];
  onTransfer?: (playlist: ParsedPlaylist) => void;
  transferringPlaylist?: ParsedPlaylist | null;
  selectedIds?: string[];
  onToggleSelect?: (name: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
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
      className="group flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition-colors"
    >
      {/* Mini album art placeholder */}
      <div
        className="w-10 h-10 rounded-lg flex-shrink-0"
        style={{ background: gradient }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">
          {track.name}
        </p>
        <p className="text-xs text-white/50 truncate">
          {track.artist}
          {track.album && ` • ${track.album}`}
        </p>
      </div>
    </motion.li>
  );
}

interface PlaylistCardProps {
  playlist: ParsedPlaylist;
  onTransfer?: (playlist: ParsedPlaylist) => void;
  isTransferring?: boolean;
  index: number;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

function PlaylistCard({
  playlist,
  onTransfer,
  isTransferring,
  index,
  isSelected,
  onToggleSelect,
}: PlaylistCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLikedSongs = playlist.source === 'liked_songs';
  const gradient = useMemo(() => generateGradient(playlist.name), [playlist.name]);

  const handleTransfer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTransfer) {
      onTransfer(playlist);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`glass rounded-2xl overflow-hidden transition-all duration-300 ${
        isTransferring ? 'glow-info animate-pulse-glow' : ''
      }`}
    >
      {/* Gradient accent bar */}
      <div className="h-1 gradient-brand" />

      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Checkbox for selection */}
          {onToggleSelect && (
            <Checkbox
              checked={isSelected || false}
              onChange={onToggleSelect}
              disabled={isTransferring}
            />
          )}
          {/* Album art placeholder */}
          <motion.div
            className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: gradient }}
            whileHover={{ scale: 1.05 }}
          >
            {isLikedSongs ? (
              <Heart className="w-8 h-8 text-white/80" fill="currentColor" />
            ) : (
              <Music className="w-8 h-8 text-white/60" />
            )}
          </motion.div>

          {/* Playlist info */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 text-left min-w-0"
          >
            <h3 className="text-lg font-semibold text-white/95 truncate">
              {playlist.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-white/50">
                {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}
              </span>
              <motion.span
                className="text-white/30"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </div>
          </button>

          {/* Transfer button */}
          <motion.button
            onClick={handleTransfer}
            disabled={!onTransfer || isTransferring}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all overflow-hidden ${
              onTransfer && !isTransferring
                ? 'glass-strong text-white hover:glow-youtube'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
            whileHover={onTransfer && !isTransferring ? { scale: 1.05 } : undefined}
            whileTap={onTransfer && !isTransferring ? { scale: 0.95 } : undefined}
            title={
              !onTransfer
                ? 'Connect YouTube Music to enable transfer'
                : isTransferring
                  ? 'Transfer in progress...'
                  : 'Transfer to YouTube Music'
            }
          >
            {/* Gradient background for enabled state */}
            {onTransfer && !isTransferring && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#1db954]/20 to-[#ff0000]/20 opacity-0 hover:opacity-100 transition-opacity" />
            )}
            <span className="relative flex items-center gap-2">
              {isTransferring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transferring...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Transfer</span>
                </>
              )}
            </span>
          </motion.button>
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
              <div className="mt-4 pt-4 border-t border-white/10">
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
  onTransfer,
  transferringPlaylist,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
}: PlaylistListProps) {
  if (playlists.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full glass flex items-center justify-center">
          <Music className="w-8 h-8 text-white/30" />
        </div>
        <p className="text-white/50">No playlists loaded</p>
        <p className="mt-1 text-sm text-white/30">
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
    <div className="space-y-8">
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
            <h2 className="text-xl font-bold text-white/95">
              Liked Songs
            </h2>
          </motion.div>
          <div className="space-y-4">
            {likedSongs.map((playlist, index) => (
              <PlaylistCard
                key={`liked-${index}`}
                playlist={playlist}
                onTransfer={onTransfer}
                isTransferring={isPlaylistTransferring(playlist)}
                index={index}
                isSelected={selectedIds.includes(playlist.name)}
                onToggleSelect={onToggleSelect ? () => onToggleSelect(playlist.name) : undefined}
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
            <h2 className="text-xl font-bold text-white/95">
              Playlists
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/60">
              {regularPlaylists.length}
            </span>
            {onSelectAll && onDeselectAll && regularPlaylists.length > 1 && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={onSelectAll}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Select all
                </button>
                <span className="text-white/20">|</span>
                <button
                  onClick={onDeselectAll}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Deselect all
                </button>
              </div>
            )}
          </motion.div>
          <div className="space-y-4">
            {regularPlaylists.map((playlist, index) => (
              <PlaylistCard
                key={`playlist-${playlist.name}-${index}`}
                playlist={playlist}
                onTransfer={onTransfer}
                isTransferring={isPlaylistTransferring(playlist)}
                index={index + likedSongs.length}
                isSelected={selectedIds.includes(playlist.name)}
                onToggleSelect={onToggleSelect ? () => onToggleSelect(playlist.name) : undefined}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
