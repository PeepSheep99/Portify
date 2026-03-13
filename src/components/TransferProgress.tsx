'use client';

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

  // Get phase text
  const phaseText = {
    matching: 'Matching tracks...',
    creating: 'Creating playlist...',
    adding: 'Adding tracks...',
  }[progress.phase];

  // Render error state
  if (progress.status === 'error') {
    return (
      <div
        className="rounded-lg border-2 border-red-500 bg-red-50 p-6 dark:border-red-400 dark:bg-red-950"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <p className="font-medium text-red-700 dark:text-red-300">
            Transfer failed
          </p>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {progress.error || 'An unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  // Render complete state
  if (progress.status === 'complete') {
    return (
      <div
        className="rounded-lg border-2 border-green-500 bg-green-50 p-6 dark:border-green-400 dark:bg-green-950"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <p className="font-medium text-green-700 dark:text-green-300">
            Transfer complete!
          </p>
        </div>
      </div>
    );
  }

  // Render in_progress state
  return (
    <div
      className="rounded-lg border-2 border-blue-500 bg-blue-50 p-6 dark:border-blue-400 dark:bg-blue-950"
      role="status"
      aria-live="polite"
    >
      <div className="space-y-4">
        {/* Phase indicator */}
        <p className="text-center font-medium text-blue-700 dark:text-blue-300">
          {phaseText}
        </p>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
            <span>
              {progress.current} / {progress.total}
            </span>
            <span>{percentage}%</span>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900"
            role="progressbar"
            aria-valuenow={progress.current}
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-label="Transfer progress"
          >
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Current track name */}
        {progress.currentTrack && progress.phase === 'matching' && (
          <p className="truncate text-center text-sm text-blue-600 dark:text-blue-400">
            {progress.currentTrack}
          </p>
        )}
      </div>
    </div>
  );
}
