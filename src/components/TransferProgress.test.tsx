import { describe, it, expect, vi } from 'vitest';
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
      expect(screen.getByText(/matching tracks/i)).toBeInTheDocument();
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
      expect(screen.getByText(/creating playlist/i)).toBeInTheDocument();
    });

    it('renders adding phase with count', () => {
      const progress = {
        current: 25,
        total: 45,
        phase: 'adding' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      expect(screen.getByText(/adding tracks/i)).toBeInTheDocument();
      expect(screen.getByText(/25.*45/)).toBeInTheDocument();
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
    it('shows correct percentage', () => {
      const progress = {
        current: 25,
        total: 100,
        phase: 'matching' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('progress bar width matches percentage', () => {
      const progress = {
        current: 50,
        total: 100,
        phase: 'matching' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      const progressBar = screen.getByRole('progressbar');
      // The inner div should have width 50%
      const innerBar = progressBar.querySelector('div');
      expect(innerBar).toHaveStyle({ width: '50%' });
    });

    it('shows 0% for zero total', () => {
      const progress = {
        current: 0,
        total: 0,
        phase: 'creating' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
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
      expect(screen.getByText(/matching tracks/i)).toBeInTheDocument();

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
      expect(screen.getByText(/creating playlist/i)).toBeInTheDocument();
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
      expect(screen.getByText(/creating playlist/i)).toBeInTheDocument();

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
      expect(screen.getByText(/adding tracks/i)).toBeInTheDocument();
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
      render(<TransferProgress progress={progress} />);
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('progress bar has accessible name', () => {
      const progress = {
        current: 25,
        total: 100,
        phase: 'matching' as const,
        status: 'in_progress' as const,
      };
      render(<TransferProgress progress={progress} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '25');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });
});
