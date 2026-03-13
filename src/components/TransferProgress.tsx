'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, ListPlus, Music2, CheckCircle, XCircle } from 'lucide-react';
import type { TransferProgress as TransferProgressType } from '@/types/transfer';

interface TransferProgressProps {
  progress: TransferProgressType | null;
}

export function TransferProgress({ progress }: TransferProgressProps) {
  if (!progress) {
    return null;
  }

  // Calculate percentage
  const percentage =
    progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : 0;

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
        className="glass-strong rounded-2xl p-8 glow-error"
        role="status"
        aria-live="polite"
      >
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center"
          >
            <XCircle className="w-8 h-8 text-red-400" />
          </motion.div>
          <p className="font-medium text-red-400 text-lg">
            Transfer failed
          </p>
          <p className="text-sm text-white/60">
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
        className="glass-strong rounded-2xl p-8 glow-success"
        role="status"
        aria-live="polite"
      >
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center"
          >
            <motion.svg
              className="w-8 h-8 text-green-400"
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
          <p className="font-medium text-green-400 text-lg">
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
      className="glass-strong rounded-2xl p-8"
      role="status"
      aria-live="polite"
    >
      <div className="space-y-6">
        {/* Circular progress */}
        <div className="relative mx-auto" style={{ width: size, height: size }}>
          {/* Background glow */}
          <div className="absolute inset-4 rounded-full bg-[#1db954]/20 blur-xl" />

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
            {/* Progress circle with solid Spotify green */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#1db954"
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
            <span className="text-4xl font-bold text-white">{percentage}%</span>
            <span className="text-sm text-white/50 mt-1">
              {progress.current} / {progress.total}
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
            <p className="text-lg font-medium text-white/90 flex items-center justify-center">
              <phaseConfig.Icon className="w-5 h-5 text-white/60 mr-2" />
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
              className="glass rounded-xl p-3"
            >
              <p className="text-center text-sm text-white/70 truncate">
                <span className="text-white/40">Now matching: </span>
                <span className="text-white/90">{progress.currentTrack}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
