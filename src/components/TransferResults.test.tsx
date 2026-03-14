import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransferResults } from './TransferResults';

// Mock animated components to immediately show final values
vi.mock('@/components/ui', () => ({
  AnimatedNumber: ({ value, className }: { value: number; className?: string }) => (
    <span className={className}>{value}</span>
  ),
  AnimatedPercentage: ({ value, className }: { value: number; className?: string }) => (
    <span className={className}>{value}%</span>
  ),
  ConfettiCelebration: () => null,
}));

const mockResult = {
  playlistId: 'playlist_123',
  playlistName: 'My Awesome Playlist',
  tracksAdded: 45,
  tracksFailed: 5,
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
    total: 50,
    matchRate: 0.9,
  },
};

describe('TransferResults', () => {
  describe('rendering states', () => {
    it('renders nothing when result is null', () => {
      const { container } = render(
        <TransferResults result={null} onClose={() => {}} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders success banner with playlist name', () => {
      render(<TransferResults result={mockResult} onClose={() => {}} />);
      expect(
        screen.getByRole('heading', { name: /My Awesome Playlist/i })
      ).toBeInTheDocument();
    });

    it('renders track counts', () => {
      render(<TransferResults result={mockResult} onClose={() => {}} />);
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('added')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
    });

    it('renders link to YouTube Music playlist', () => {
      render(<TransferResults result={mockResult} onClose={() => {}} />);
      const link = screen.getByRole('link', { name: /open in youtube music/i });
      expect(link).toHaveAttribute(
        'href',
        expect.stringContaining('playlist_123')
      );
    });
  });

  describe('match rate display', () => {
    it('shows match rate percentage', () => {
      render(<TransferResults result={mockResult} onClose={() => {}} />);
      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    it('uses green color for high match rate (>80%)', () => {
      render(<TransferResults result={mockResult} onClose={() => {}} />);
      const rateElement = screen.getByText('90%');
      // Color class is on parent div
      expect(rateElement.parentElement).toHaveClass('text-green-400');
    });

    it('uses yellow color for medium match rate (50-80%)', () => {
      const mediumResult = {
        ...mockResult,
        matchResult: { ...mockResult.matchResult, matchRate: 0.65 },
      };
      render(<TransferResults result={mediumResult} onClose={() => {}} />);
      const rateElement = screen.getByText('65%');
      // Color class is on parent div
      expect(rateElement.parentElement).toHaveClass('text-yellow-400');
    });

    it('uses red color for low match rate (<50%)', () => {
      const lowResult = {
        ...mockResult,
        matchResult: { ...mockResult.matchResult, matchRate: 0.3 },
      };
      render(<TransferResults result={lowResult} onClose={() => {}} />);
      const rateElement = screen.getByText('30%');
      // Color class is on parent div
      expect(rateElement.parentElement).toHaveClass('text-red-400');
    });
  });

  describe('expandable sections', () => {
    it('can expand matched tracks list', () => {
      render(<TransferResults result={mockResult} onClose={() => {}} />);
      fireEvent.click(
        screen.getByRole('button', { name: /^matched tracks/i })
      );
      // Look for text in the expanded list
      expect(screen.getAllByText('Song 1').length).toBeGreaterThan(0);
      expect(screen.getByText('98%')).toBeInTheDocument(); // confidence
    });

    it('can expand unmatched tracks list', () => {
      render(<TransferResults result={mockResult} onClose={() => {}} />);
      fireEvent.click(screen.getByText(/unmatched tracks/i));
      expect(screen.getByText('Rare Song')).toBeInTheDocument();
    });

    it('shows reason for unmatched tracks', () => {
      render(<TransferResults result={mockResult} onClose={() => {}} />);
      fireEvent.click(screen.getByText(/unmatched tracks/i));
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });

    it('toggles expansion on repeated click', () => {
      render(<TransferResults result={mockResult} onClose={() => {}} />);
      const button = screen.getByRole('button', { name: /^matched tracks/i });
      // Initially collapsed
      expect(button).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(button);
      // Now expanded
      expect(button).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(button);
      // Collapsed again
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('action buttons', () => {
    it('calls onClose when Done button clicked', () => {
      const onClose = vi.fn();
      render(<TransferResults result={mockResult} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: /done/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows Continue button when batch has more playlists', () => {
      const onClose = vi.fn();
      render(
        <TransferResults
          result={mockResult}
          onClose={onClose}
          batchProgress={{ current: 1, total: 3 }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('handles result with all tracks matched', () => {
      const perfectResult = {
        ...mockResult,
        tracksFailed: 0,
        matchResult: {
          ...mockResult.matchResult,
          unmatched: [],
          matchRate: 1,
        },
      };
      render(<TransferResults result={perfectResult} onClose={() => {}} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles result with no tracks matched', () => {
      const failedResult = {
        ...mockResult,
        tracksAdded: 0,
        tracksFailed: 50,
        matchResult: { ...mockResult.matchResult, matched: [], matchRate: 0 },
      };
      render(<TransferResults result={failedResult} onClose={() => {}} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles result with empty playlist', () => {
      const emptyResult = {
        ...mockResult,
        tracksAdded: 0,
        tracksFailed: 0,
        matchResult: { matched: [], unmatched: [], total: 0, matchRate: 0 },
      };
      const { container } = render(
        <TransferResults result={emptyResult} onClose={() => {}} />
      );
      // Should render without errors
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('accessibility', () => {
    it('expandable sections are keyboard accessible', () => {
      render(<TransferResults result={mockResult} onClose={() => {}} />);
      const expandButton = screen.getByRole('button', { name: /^matched tracks/i });
      // Buttons are natively keyboard accessible (Enter/Space trigger click)
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('Done button has accessible label', () => {
      render(<TransferResults result={mockResult} onClose={() => {}} />);
      const doneButton = screen.getByRole('button', { name: /done/i });
      expect(doneButton).toBeInTheDocument();
    });
  });
});
