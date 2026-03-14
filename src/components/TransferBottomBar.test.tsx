import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransferBottomBar } from './TransferBottomBar';

describe('TransferBottomBar', () => {
  it('renders transfer count in button text', () => {
    render(
      <TransferBottomBar
        count={3}
        onTransfer={() => {}}
        isAuthenticated={true}
        isTransferring={false}
      />
    );
    expect(screen.getByText(/Transfer 3 playlists/)).toBeInTheDocument();
  });

  it('disables button when not authenticated', () => {
    render(
      <TransferBottomBar
        count={1}
        onTransfer={() => {}}
        isAuthenticated={false}
        isTransferring={false}
      />
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables button when transferring', () => {
    render(
      <TransferBottomBar
        count={1}
        onTransfer={() => {}}
        isAuthenticated={true}
        isTransferring={true}
      />
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('calls onTransfer when clicked', () => {
    const onTransfer = vi.fn();
    render(
      <TransferBottomBar
        count={1}
        onTransfer={onTransfer}
        isAuthenticated={true}
        isTransferring={false}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onTransfer).toHaveBeenCalled();
  });

  it('does not render when count is 0', () => {
    const { container } = render(
      <TransferBottomBar
        count={0}
        onTransfer={() => {}}
        isAuthenticated={true}
        isTransferring={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
