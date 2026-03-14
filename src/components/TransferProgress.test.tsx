import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransferProgress } from './TransferProgress';

describe('TransferProgress', () => {
  describe('rendering states', () => {
    it('renders nothing when progress is null', () => {
      const { container } = render(<TransferProgress progress={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders matching phase with track name', () => {
      const progress = {
        current: 5,
        total: 50,
        phase: 'matching' as const,
        currentTrack: 'Bohemian Rhapsody',
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      // Phase text appears twice (in center and below)
      expect(screen.getAllByText(/matching tracks/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    });

    it('renders creating phase', () => {
      const progress = {
        current: 0,
        total: 0,
        phase: 'creating' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      // Phase text appears twice (in center and below)
      expect(screen.getAllByText(/creating playlist/i).length).toBeGreaterThan(0);
    });

    it('renders adding phase with phase label', () => {
      const progress = {
        current: 25,
        total: 45,
        phase: 'adding' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      // Phase text appears twice (in center and below)
      expect(screen.getAllByText(/adding tracks/i).length).toBeGreaterThan(0);
      // Component no longer shows "25/45" count, just phase label and percentage
    });

    it('renders error state with message', () => {
      const progress = {
        current: 10,
        total: 50,
        phase: 'matching' as const,
        status: 'error' as const,
        error: 'API rate limit exceeded',
      };
      render(<TransferProgress progress={progress} />);
      expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument();
    });

    it('renders complete state', () => {
      const progress = {
        current: 50,
        total: 50,
        phase: 'adding' as const,
        status: 'complete' as const,
      };
      render(<TransferProgress progress={progress} />);
      expect(screen.getByText(/complete/i)).toBeInTheDocument();
    });
  });

  describe('progress bar', () => {
    it('shows correct unified percentage for matching phase', () => {
      const progress = {
        current: 25,
        total: 100,
        phase: 'matching' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      // Unified progress: matching(25, 100) = 25/100 * 40% = 10%
      expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('shows SVG circle for progress visualization', () => {
      const progress = {
        current: 50,
        total: 100,
        phase: 'matching' as const,
        status: 'in_progress' as const,
      };
      const { container } = render(<TransferProgress progress={progress} />);
      // Component uses SVG circles, not role="progressbar"
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      const circles = svg?.querySelectorAll('circle');
      expect(circles?.length).toBe(2); // background + progress circle
    });

    it('shows 40% for creating phase with zero total', () => {
      const progress = {
        current: 0,
        total: 0,
        phase: 'creating' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      // Unified progress: creating(0, 0) = 40 + 0 * 0.2 = 40%
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('clamps to 100% when current exceeds total', () => {
      const progress = {
        current: 105,
        total: 100,
        phase: 'adding' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('phase transitions', () => {
    it('transitions from matching to creating', () => {
      const { rerender } = render(
        <TransferProgress
          progress={{
            current: 50,
            total: 50,
            phase: 'matching',
            status: 'in_progress',
          }}
        />
      );
      // Phase text appears twice (in center and below)
      expect(screen.getAllByText(/matching tracks/i).length).toBeGreaterThan(0);

      rerender(
        <TransferProgress
          progress={{
            current: 0,
            total: 0,
            phase: 'creating',
            status: 'in_progress',
          }}
        />
      );
      expect(screen.getAllByText(/creating playlist/i).length).toBeGreaterThan(0);
    });

    it('transitions from creating to adding', () => {
      const { rerender } = render(
        <TransferProgress
          progress={{
            current: 0,
            total: 0,
            phase: 'creating',
            status: 'in_progress',
          }}
        />
      );
      expect(screen.getAllByText(/creating playlist/i).length).toBeGreaterThan(0);

      rerender(
        <TransferProgress
          progress={{
            current: 10,
            total: 45,
            phase: 'adding',
            status: 'in_progress',
          }}
        />
      );
      expect(screen.getAllByText(/adding tracks/i).length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('has aria-live region for status updates', () => {
      const progress = {
        current: 5,
        total: 50,
        phase: 'matching' as const,
        status: 'in_progress' as const,
      };
      const { container } = render(<TransferProgress progress={progress} />);
      // Find the element with aria-live attribute directly
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('unified progress calculation', () => {
    it('calculates matching phase as 0-40%', () => {
      const progress = {
        current: 50,
        total: 100,
        phase: 'matching' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      // matching(50, 100) = 50/100 * 40 = 20%
      expect(screen.getByText('20%')).toBeInTheDocument();
    });

    it('calculates creating phase as 40-60%', () => {
      const progress = {
        current: 50,
        total: 100,
        phase: 'creating' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      // creating(50, 100) = 40 + (50/100 * 20) = 40 + 10 = 50%
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('calculates adding phase as 60-100%', () => {
      const progress = {
        current: 50,
        total: 100,
        phase: 'adding' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      // adding(50, 100) = 60 + (50/100 * 40) = 60 + 20 = 80%
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('displays phase label below percentage', () => {
      const progress = {
        current: 25,
        total: 50,
        phase: 'matching' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      // Phase label text appears twice (center and below)
      expect(screen.getAllByText('Matching tracks').length).toBeGreaterThan(0);
    });
  });
});
