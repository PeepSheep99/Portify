import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders message when visible', () => {
    render(<Toast message="Copied!" isVisible={true} />);
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<Toast message="Copied!" isVisible={false} />);
    // AnimatePresence won't render content when isVisible is false
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
  });
});
