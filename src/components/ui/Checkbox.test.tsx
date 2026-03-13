import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders unchecked by default when checked=false', () => {
    render(<Checkbox checked={false} onChange={() => {}} />);
    const button = screen.getByRole('checkbox');
    expect(button).toHaveAttribute('aria-checked', 'false');
  });

  it('shows check icon when checked=true', () => {
    render(<Checkbox checked={true} onChange={() => {}} />);
    const button = screen.getByRole('checkbox');
    expect(button).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange when clicked', () => {
    const handleChange = vi.fn();
    render(<Checkbox checked={false} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('does not call onChange when disabled', () => {
    const handleChange = vi.fn();
    render(<Checkbox checked={false} onChange={handleChange} disabled />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('renders with label when provided', () => {
    render(<Checkbox checked={false} onChange={() => {}} label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });
});
