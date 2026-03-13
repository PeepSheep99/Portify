'use client';

import { useState } from 'react';
import type { TransferResult } from '@/types/transfer';

interface TransferResultsProps {
  result: TransferResult | null;
  onClose: () => void;
}

export function TransferResults({ result, onClose }: TransferResultsProps) {
  const [expandedSection, setExpandedSection] = useState<
    'matched' | 'unmatched' | null
  >(null);

  if (!result) {
    return null;
  }

  const { playlistId, playlistName, tracksAdded, tracksFailed, matchResult } =
    result;

  // Calculate match rate percentage (0-100)
  const matchRatePercent = Math.round(matchResult.matchRate * 100);

  // Determine match rate color
  const matchRateColor =
    matchRatePercent >= 80
      ? 'text-green-600 dark:text-green-400'
      : matchRatePercent >= 50
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400';

  const toggleSection = (section: 'matched' | 'unmatched') => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const youtubePlaylistUrl = `https://music.youtube.com/playlist?list=${playlistId}`;

  return (
    <div className="rounded-lg border-2 border-green-500 bg-white p-6 shadow-lg dark:border-green-400 dark:bg-zinc-900">
      {/* Success banner */}
      <div className="mb-6 text-center">
        <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <svg
            className="h-6 w-6 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Playlist created: {playlistName}
        </h2>
        <a
          href={youtubePlaylistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Open in YouTube Music
        </a>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4 border-y border-zinc-200 py-4 dark:border-zinc-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {tracksAdded}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            tracks added
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {tracksFailed}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">failed</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${matchRateColor}`}>
            {matchRatePercent}%
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">match rate</p>
        </div>
      </div>

      {/* Expandable sections */}
      <div className="space-y-3">
        {/* Matched tracks */}
        {matchResult.matched.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => toggleSection('matched')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') toggleSection('matched');
              }}
              className="flex w-full items-center justify-between p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
              aria-expanded={expandedSection === 'matched'}
            >
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Matched tracks ({matchResult.matched.length})
              </span>
              <span className="text-zinc-400">
                {expandedSection === 'matched' ? '\u25B2' : '\u25BC'}
              </span>
            </button>
            {expandedSection === 'matched' && (
              <div className="max-h-64 overflow-y-auto border-t border-zinc-200 p-3 dark:border-zinc-700">
                <ul className="space-y-2">
                  {matchResult.matched.map((track, index) => (
                    <li
                      key={`matched-${index}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {track.original.name}
                        </span>
                        <span className="text-zinc-400"> by </span>
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {track.original.artist}
                        </span>
                        <span className="text-zinc-400"> &rarr; </span>
                        <span className="text-green-600 dark:text-green-400">
                          {track.matched.title}
                        </span>
                      </div>
                      <span className="ml-2 text-xs text-zinc-500">
                        {Math.round(track.confidence)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Unmatched tracks */}
        {matchResult.unmatched.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => toggleSection('unmatched')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') toggleSection('unmatched');
              }}
              className="flex w-full items-center justify-between p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
              aria-expanded={expandedSection === 'unmatched'}
            >
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Unmatched tracks ({matchResult.unmatched.length})
              </span>
              <span className="text-zinc-400">
                {expandedSection === 'unmatched' ? '\u25B2' : '\u25BC'}
              </span>
            </button>
            {expandedSection === 'unmatched' && (
              <div className="max-h-64 overflow-y-auto border-t border-zinc-200 p-3 dark:border-zinc-700">
                <ul className="space-y-2">
                  {matchResult.unmatched.map((track, index) => (
                    <li
                      key={`unmatched-${index}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {track.original.name}
                        </span>
                        <span className="text-zinc-400"> by </span>
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {track.original.artist}
                        </span>
                      </div>
                      <span className="ml-2 text-xs text-red-500">
                        {track.reason === 'not_found'
                          ? 'Not found'
                          : track.reason === 'low_confidence'
                            ? 'Low confidence'
                            : 'Error'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={onClose}
          className="rounded-lg bg-zinc-100 px-6 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Close
        </button>
        <button
          onClick={onClose}
          className="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600"
        >
          Transfer another
        </button>
      </div>
    </div>
  );
}
