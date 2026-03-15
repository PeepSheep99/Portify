import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransferResults } from './TransferResults';
import type { BatchTransferResult } from '@/types/transfer';

// Mock animated components
vi.mock('@/components/ui', () => ({
  ConfettiCelebration: () => null,
}));

const mockBatchResult: BatchTransferResult = {
  results: [
    {
      playlistId: 'playlist_123',
      playlistName: 'Chill Vibes',
      tracksAdded: 6,
      tracksFailed: 1,
      matchResult: {
        matched: [
          {
            original: { name: 'Song 1', artist: 'Artist 1', album: 'Album 1' },
            matched: { videoId: 'vid1', title: 'Song 1', artist: 'Artist 1' },
            confidence: 98,
          },
        ],
        unmatched: [
          {
            original: { name: 'Rare Song', artist: 'Unknown', album: null },
            reason: 'not_found' as const,
          },
        ],
        total: 7,
        matchRate: 0.86,
      },
    },
    {
      playlistName: 'Workout Mix',
      tracksAdded: 0,
      tracksFailed: 0,
      skipped: true,
      reason: 'Playlist already exists',
    },
  ],
  totalPlaylists: 2,
  created: 1,
  skipped: 1,
  failed: 0,
};

describe('TransferResults', () => {
  describe('rendering states', () => {
    it('renders transfer complete header', () => {
      render(<TransferResults batchResult={mockBatchResult} onClose={() => {}} />);
      expect(screen.getByRole('heading', { name: /Transfer Complete/i })).toBeInTheDocument();
    });

    it('renders total playlists processed count', () => {
      render(<TransferResults batchResult={mockBatchResult} onClose={() => {}} />);
      expect(screen.getByText('2 playlists processed')).toBeInTheDocument();
    });

    it('renders singular text for single playlist', () => {
      const singleResult: BatchTransferResult = {
        ...mockBatchResult,
        results: [mockBatchResult.results[0]],
        totalPlaylists: 1,
        skipped: 0,
      };
      render(<TransferResults batchResult={singleResult} onClose={() => {}} />);
      expect(screen.getByText('1 playlist processed')).toBeInTheDocument();
    });

    it('renders summary badges', () => {
      render(<TransferResults batchResult={mockBatchResult} onClose={() => {}} />);
      expect(screen.getByText('1 created')).toBeInTheDocument();
      expect(screen.getByText('1 skipped')).toBeInTheDocument();
    });
  });

  describe('playlist list', () => {
    it('renders all playlists with names', () => {
      render(<TransferResults batchResult={mockBatchResult} onClose={() => {}} />);
      expect(screen.getByText('Chill Vibes')).toBeInTheDocument();
      expect(screen.getByText('Workout Mix')).toBeInTheDocument();
    });

    it('shows track count for created playlists', () => {
      render(<TransferResults batchResult={mockBatchResult} onClose={() => {}} />);
      expect(screen.getByText(/6 tracks added, 1 not found/)).toBeInTheDocument();
    });

    it('shows "Already exists" for skipped playlists', () => {
      render(<TransferResults batchResult={mockBatchResult} onClose={() => {}} />);
      expect(screen.getByText('Already exists')).toBeInTheDocument();
    });
  });

  describe('expandable unmatched tracks', () => {
    it('can expand to see unmatched tracks', () => {
      render(<TransferResults batchResult={mockBatchResult} onClose={() => {}} />);
      // Click on the playlist with unmatched tracks
      fireEvent.click(screen.getByText('Chill Vibes'));
      expect(screen.getByText('Tracks not found')).toBeInTheDocument();
      expect(screen.getByText(/Rare Song/)).toBeInTheDocument();
    });

    it('cannot expand skipped playlists', () => {
      render(<TransferResults batchResult={mockBatchResult} onClose={() => {}} />);
      const workoutMix = screen.getByText('Workout Mix').closest('button');
      expect(workoutMix).toBeDisabled();
    });
  });

  describe('action buttons', () => {
    it('renders link to YouTube Music library', () => {
      render(<TransferResults batchResult={mockBatchResult} onClose={() => {}} />);
      const link = screen.getByRole('link', { name: /Open YouTube Music Library/i });
      expect(link).toHaveAttribute('href', 'https://music.youtube.com/library/playlists');
    });

    it('calls onClose when Done button clicked', () => {
      const onClose = vi.fn();
      render(<TransferResults batchResult={mockBatchResult} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: /done/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('handles all playlists created successfully', () => {
      const allCreated: BatchTransferResult = {
        results: [
          {
            playlistId: 'p1',
            playlistName: 'Playlist 1',
            tracksAdded: 10,
            tracksFailed: 0,
            matchResult: { matched: [], unmatched: [], total: 10, matchRate: 1 },
          },
        ],
        totalPlaylists: 1,
        created: 1,
        skipped: 0,
        failed: 0,
      };
      render(<TransferResults batchResult={allCreated} onClose={() => {}} />);
      expect(screen.getByText('1 created')).toBeInTheDocument();
      expect(screen.queryByText(/skipped/)).not.toBeInTheDocument();
    });

    it('handles all playlists skipped', () => {
      const allSkipped: BatchTransferResult = {
        results: [
          { playlistName: 'P1', tracksAdded: 0, tracksFailed: 0, skipped: true },
          { playlistName: 'P2', tracksAdded: 0, tracksFailed: 0, skipped: true },
        ],
        totalPlaylists: 2,
        created: 0,
        skipped: 2,
        failed: 0,
      };
      render(<TransferResults batchResult={allSkipped} onClose={() => {}} />);
      expect(screen.getByText('2 skipped')).toBeInTheDocument();
      expect(screen.queryByText(/created/)).not.toBeInTheDocument();
    });

    it('handles failed transfers', () => {
      const withFailed: BatchTransferResult = {
        results: [
          {
            playlistName: 'Failed Playlist',
            tracksAdded: 0,
            tracksFailed: 5,
            reason: 'API error',
          },
        ],
        totalPlaylists: 1,
        created: 0,
        skipped: 0,
        failed: 1,
      };
      render(<TransferResults batchResult={withFailed} onClose={() => {}} />);
      expect(screen.getByText('API error')).toBeInTheDocument();
    });
  });
});
