'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronDown } from 'lucide-react';
import { AnimatedNumber, AnimatedPercentage, ConfettiCelebration } from '@/components/ui';
import type { TransferResult } from '@/types/transfer';

interface TransferResultsProps {
  result: TransferResult | null;
  onClose: () => void;
  batchProgress?: { current: number; total: number } | null;
}

export function TransferResults({ result, onClose, batchProgress }: TransferResultsProps) {
  const [expandedSection, setExpandedSection] = useState<
    'matched' | 'unmatched' | null
  >(null);

  if (!result) {
    return null;
  }

  const hasMorePlaylists = batchProgress && batchProgress.current < batchProgress.total;

  const { playlistId, playlistName, tracksAdded, tracksFailed, matchResult } =
    result;

  // Calculate match rate percentage (0-100)
  const matchRatePercent = Math.round(matchResult.matchRate * 100);

  // Determine match rate color
  const getMatchRateColor = () => {
    if (matchRatePercent >= 80) return 'text-green-400';
    if (matchRatePercent >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMatchRateBg = () => {
    if (matchRatePercent >= 80) return 'from-green-500/20 to-green-500/5';
    if (matchRatePercent >= 50) return 'from-yellow-500/20 to-yellow-500/5';
    return 'from-red-500/20 to-red-500/5';
  };

  const toggleSection = (section: 'matched' | 'unmatched') => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const youtubePlaylistUrl = `https://music.youtube.com/playlist?list=${playlistId}`;

  return (
    <>
      {/* Confetti celebration */}
      <ConfettiCelebration trigger={true} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
      >
        {/* Success banner */}
        <div className="mb-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, delay: 0.2 }}
            className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500/30 to-green-500/10"
          >
            <motion.svg
              className="h-8 w-8 text-green-400"
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
            className="text-2xl font-bold text-[var(--text-primary)]"
          >
            {playlistName}
          </motion.h2>

          <motion.a
            href={youtubePlaylistUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-3 inline-flex items-center gap-2 text-base text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            <span>Open in YouTube Music</span>
            <ExternalLink className="w-5 h-5" />
          </motion.a>
        </div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 grid grid-cols-3 gap-3"
        >
          {/* Tracks added */}
          <div className="glass rounded-xl p-5 text-center">
            <div className="text-4xl font-black text-green-400">
              <AnimatedNumber value={tracksAdded} />
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-2">added</p>
          </div>

          {/* Tracks failed */}
          <div className="glass rounded-xl p-5 text-center">
            <div className="text-4xl font-black text-[var(--text-secondary)]">
              <AnimatedNumber value={tracksFailed} />
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-2">failed</p>
          </div>

          {/* Match rate with gauge */}
          <div className={`glass rounded-xl p-5 text-center bg-gradient-to-b ${getMatchRateBg()}`}>
            <div className={`text-4xl font-black ${getMatchRateColor()}`}>
              <AnimatedPercentage value={matchRatePercent} />
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-2">match rate</p>
          </div>
        </motion.div>

        {/* Expandable sections */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          {/* Matched tracks */}
          {matchResult.matched.length > 0 && (
            <div className="glass rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('matched')}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                aria-expanded={expandedSection === 'matched'}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-semibold text-[var(--text-primary)] text-base">
                    Matched tracks
                  </span>
                  <span className="text-base text-[var(--text-muted)]">
                    ({matchResult.matched.length})
                  </span>
                </div>
                <motion.span
                  animate={{ rotate: expandedSection === 'matched' ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[var(--text-muted)]"
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.span>
              </button>

              <AnimatePresence>
                {expandedSection === 'matched' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-56 overflow-y-auto border-t border-[var(--border)] p-3">
                      <ul className="space-y-2">
                        {matchResult.matched.map((track, index) => (
                          <motion.li
                            key={`matched-${index}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="flex items-center justify-between text-base py-2 px-3 rounded-lg hover:bg-white/5"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-[var(--text-primary)] truncate block font-medium">
                                {track.original.name}
                              </span>
                              <span className="text-[var(--text-muted)] text-sm">
                                {track.original.artist} &#8594; {track.matched.title}
                              </span>
                            </div>
                            <span className="ml-2 px-2 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-400">
                              {Math.round(track.confidence)}%
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Unmatched tracks */}
          {matchResult.unmatched.length > 0 && (
            <div className="glass rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('unmatched')}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                aria-expanded={expandedSection === 'unmatched'}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-semibold text-[var(--text-primary)] text-base">
                    Unmatched tracks
                  </span>
                  <span className="text-base text-[var(--text-muted)]">
                    ({matchResult.unmatched.length})
                  </span>
                </div>
                <motion.span
                  animate={{ rotate: expandedSection === 'unmatched' ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[var(--text-muted)]"
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.span>
              </button>

              <AnimatePresence>
                {expandedSection === 'unmatched' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-56 overflow-y-auto border-t border-[var(--border)] p-3">
                      <ul className="space-y-2">
                        {matchResult.unmatched.map((track, index) => (
                          <motion.li
                            key={`unmatched-${index}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="flex items-center justify-between text-base py-2 px-3 rounded-lg hover:bg-white/5"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-[var(--text-primary)] truncate block font-medium">
                                {track.original.name}
                              </span>
                              <span className="text-[var(--text-muted)] text-sm">
                                {track.original.artist}
                              </span>
                            </div>
                            <span className="ml-2 px-2 py-1 rounded-full text-sm font-semibold bg-red-500/20 text-red-400">
                              {track.reason === 'not_found'
                                ? 'Not found'
                                : track.reason === 'low_confidence'
                                  ? 'Low match'
                                  : 'Error'}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          {/* Batch progress indicator */}
          {batchProgress && batchProgress.total > 1 && (
            <p className="text-sm text-[var(--text-muted)]">
              {batchProgress.current} of {batchProgress.total} playlists complete
            </p>
          )}

          <div className="flex justify-center gap-4">
            <motion.button
              onClick={onClose}
              className="bg-[var(--spotify-green)] rounded-xl px-8 py-3 font-semibold text-lg text-white transition-all hover:bg-[var(--spotify-green-light)] shadow-lg glow-spotify"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {hasMorePlaylists ? (
                <span className="flex items-center gap-2">
                  Continue
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              ) : (
                'Done'
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
