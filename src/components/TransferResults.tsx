'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronDown, Check, SkipForward, AlertCircle } from 'lucide-react';
import { ConfettiCelebration } from '@/components/ui';
import type { BatchTransferResult, TransferResult } from '@/types/transfer';

interface TransferResultsProps {
  batchResult: BatchTransferResult;
  onClose: () => void;
}

export function TransferResults({ batchResult, onClose }: TransferResultsProps) {
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);

  const { results, totalPlaylists, created, skipped } = batchResult;

  // YouTube Music library URL
  const youtubeLibraryUrl = 'https://music.youtube.com/library/playlists';

  const togglePlaylist = (name: string) => {
    setExpandedPlaylist((prev) => (prev === name ? null : name));
  };

  const getStatusIcon = (result: TransferResult) => {
    if (result.skipped) {
      return (
        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
          <SkipForward className="w-4 h-4 text-yellow-400" />
        </div>
      );
    }
    if (result.tracksAdded > 0) {
      return (
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4 text-green-400" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-4 h-4 text-red-400" />
      </div>
    );
  };

  const getStatusText = (result: TransferResult) => {
    if (result.skipped) {
      return 'Already exists';
    }
    if (result.tracksAdded > 0) {
      const failedCount = result.tracksFailed || 0;
      if (failedCount > 0) {
        return `${result.tracksAdded} tracks added, ${failedCount} not found`;
      }
      return `${result.tracksAdded} tracks added`;
    }
    return result.reason || 'Failed to transfer';
  };

  const getPlaylistName = (result: TransferResult) => {
    return result.playlistName || result.playlist_name || 'Unknown';
  };

  // Check if all transfers were successful (created or skipped is fine)
  const allSuccessful = results.every(r => r.skipped || r.tracksAdded > 0);

  return (
    <>
      {/* Confetti only if at least one playlist was created */}
      {created > 0 && <ConfettiCelebration trigger={true} />}

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
      >
        {/* Success header */}
        <div className="mb-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, delay: 0.2 }}
            className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${
              allSuccessful
                ? 'bg-gradient-to-br from-green-500/30 to-green-500/10'
                : 'bg-gradient-to-br from-yellow-500/30 to-yellow-500/10'
            }`}
          >
            <motion.svg
              className={`h-8 w-8 ${allSuccessful ? 'text-green-400' : 'text-yellow-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              />
            </motion.svg>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-[var(--text-primary)] mb-2"
          >
            Transfer Complete
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[var(--text-secondary)]"
          >
            {totalPlaylists === 1
              ? '1 playlist processed'
              : `${totalPlaylists} playlists processed`}
          </motion.p>

          {/* Summary badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center gap-3 mt-4"
          >
            {created > 0 && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400">
                {created} created
              </span>
            )}
            {skipped > 0 && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400">
                {skipped} skipped
              </span>
            )}
          </motion.div>
        </div>

        {/* Playlist results list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2 mb-6"
        >
          {results.map((result, index) => {
            const name = getPlaylistName(result);
            const hasUnmatched = result.matchResult?.unmatched && result.matchResult.unmatched.length > 0;
            const isExpanded = expandedPlaylist === name;

            return (
              <div key={`${name}-${index}`} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => hasUnmatched && togglePlaylist(name)}
                  disabled={!hasUnmatched}
                  className={`flex w-full items-center gap-3 p-4 text-left transition-colors ${
                    hasUnmatched ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {getStatusIcon(result)}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] truncate">
                      {name}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {getStatusText(result)}
                    </p>
                  </div>

                  {hasUnmatched && (
                    <motion.span
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[var(--text-muted)]"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.span>
                  )}
                </button>

                {/* Expandable section for unmatched tracks */}
                <AnimatePresence>
                  {isExpanded && hasUnmatched && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="max-h-40 overflow-y-auto border-t border-[var(--border)] p-3">
                        <p className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wide">
                          Tracks not found
                        </p>
                        <ul className="space-y-1">
                          {result.matchResult?.unmatched.map((track, idx) => (
                            <li
                              key={`unmatched-${idx}`}
                              className="text-sm text-[var(--text-secondary)] py-1"
                            >
                              {track.original.name} - {track.original.artist}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-center gap-3"
        >
          <a
            href={youtubeLibraryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            <span>Open YouTube Music Library</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <motion.button
            onClick={onClose}
            className="bg-[var(--spotify-green)] rounded-xl px-8 py-3 font-semibold text-lg text-white transition-all hover:bg-[var(--spotify-green-light)] shadow-lg glow-spotify"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Done
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  );
}
