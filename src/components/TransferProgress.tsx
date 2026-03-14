'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, ListPlus, Music2, XCircle } from 'lucide-react';
import type { TransferProgress as TransferProgressType } from '@/types/transfer';

interface TransferProgressProps {
  progress: TransferProgressType | null;
  playlistName?: string;
  batchProgress?: { current: number; total: number } | null;
}

// Unified progress calculation - progress never resets between phases
function calculateUnifiedProgress(
  phase: 'matching' | 'creating' | 'adding',
  current: number,
  total: number
): number {
  const phaseProgress = total > 0 ? (current / total) * 100 : 0;
  switch (phase) {
    case 'matching': return phaseProgress * 0.4;           // 0-40%
    case 'creating': return 40 + phaseProgress * 0.2;      // 40-60%
    case 'adding':   return 60 + phaseProgress * 0.4;      // 60-100%
    default: return 0;
  }
}

export function TransferProgress({ progress, playlistName, batchProgress }: TransferProgressProps) {
  if (!progress) {
    return null;
  }

  // Calculate unified percentage (0-100%, never resets)
  const percentage = Math.min(100, Math.round(
    calculateUnifiedProgress(progress.phase, progress.current, progress.total)
  ));

  // SVG circle dimensions
  const size = 160;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Get phase text and icon
  const phaseConfig = {
    matching: { text: 'Matching tracks', Icon: Search },
    creating: { text: 'Creating playlist', Icon: ListPlus },
    adding: { text: 'Adding tracks', Icon: Music2 },
  }[progress.phase];

  // Render error state
  if (progress.status === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-2xl p-10 glow-error"
        role="status"
        aria-live="polite"
      >
        <div className="text-center space-y-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center"
          >
            <XCircle className="w-10 h-10 text-red-500" />
          </motion.div>
          <p className="font-bold text-red-400 text-2xl">
            Transfer failed
          </p>
          <p className="text-base text-[var(--text-secondary)]">
            {progress.error || 'An unknown error occurred'}
          </p>
        </div>
      </motion.div>
    );
  }

  // Render complete state (brief flash before TransferResults takes over)
  if (progress.status === 'complete') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-2xl p-10 glow-success"
        role="status"
        aria-live="polite"
      >
        <div className="text-center space-y-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center"
          >
            <motion.svg
              className="w-10 h-10 text-green-400"
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
                transition={{ duration: 0.5 }}
              />
            </motion.svg>
          </motion.div>
          <p className="font-bold text-green-400 text-2xl">
            Transfer complete!
          </p>
        </div>
      </motion.div>
    );
  }

  // Render in_progress state
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-strong rounded-2xl p-10"
      role="status"
      aria-live="polite"
    >
      <div className="space-y-8">
        {/* Batch progress indicator */}
        {batchProgress && batchProgress.total > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="text-sm font-medium text-[var(--text-muted)]">
              Playlist {batchProgress.current} of {batchProgress.total}
            </span>
            {playlistName && (
              <p className="text-lg font-semibold text-[var(--text-primary)] mt-1 truncate">
                {playlistName}
              </p>
            )}
          </motion.div>
        )}

        {/* Show playlist name even for single playlist */}
        {(!batchProgress || batchProgress.total === 1) && playlistName && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-lg font-semibold text-[var(--text-primary)] truncate">
              {playlistName}
            </p>
          </motion.div>
        )}

        {/* Circular progress */}
        <div className="relative mx-auto" style={{ width: size, height: size }}>
          {/* Background glow */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[var(--spotify-green)]/30 via-[var(--accent)]/20 to-[var(--youtube-red)]/30 blur-xl" />

          {/* SVG Progress Circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle with transfer gradient */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--spotify-green)" />
                <stop offset="50%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--youtube-red)" />
              </linearGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#progressGradient)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-[var(--text-primary)]">{percentage}%</span>
            <span className="text-base text-[var(--text-secondary)] mt-2">
              {phaseConfig.text}
            </span>
          </div>
        </div>

        {/* Phase indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={progress.phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-xl font-semibold text-[var(--text-secondary)] flex items-center justify-center">
              <phaseConfig.Icon className="w-6 h-6 text-[var(--spotify-green)] mr-3" />
              {phaseConfig.text}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Current track name */}
        <AnimatePresence>
          {progress.currentTrack && progress.phase === 'matching' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass rounded-xl p-4"
            >
              <p className="text-center text-base text-[var(--text-secondary)] truncate">
                <span className="text-[var(--text-muted)]">Now matching: </span>
                <span className="text-[var(--text-primary)] font-medium">{progress.currentTrack}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
