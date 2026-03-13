import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileDropzone } from './FileDropzone';

// Mock parseSpotifyFile
vi.mock('@/lib/spotifyParser', () => ({
  parseSpotifyFile: vi.fn((data, filename) => {
    if (filename.includes('Playlist')) {
      return [
        {
          name: 'Test Playlist',
          source: 'playlist' as const,
          tracks: [{ name: 'Song 1', artist: 'Artist 1', album: 'Album 1' }],
        },
      ];
    }
    if (filename.includes('Library')) {
      return [
        {
          name: 'Liked Songs',
          source: 'liked_songs' as const,
          tracks: [{ name: 'Liked Song', artist: 'Artist', album: null }],
        },
      ];
    }
    return [];
  }),
}));

describe('FileDropzone', () => {
  const mockOnPlaylistsParsed = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dropzone area with instructions', () => {
    render(<FileDropzone onPlaylistsParsed={mockOnPlaylistsParsed} />);

    expect(
      screen.getByText('Drag and drop Spotify JSON files here')
    ).toBeInTheDocument();
    expect(screen.getByText('or click to select files')).toBeInTheDocument();
  });

  it('has file input that accepts JSON files', () => {
    render(<FileDropzone onPlaylistsParsed={mockOnPlaylistsParsed} />);

    const input = screen.getByTestId('file-input');
    expect(input).toHaveAttribute('accept', 'application/json,.json');
  });

  it('calls onPlaylistsParsed when file is dropped', async () => {
    render(<FileDropzone onPlaylistsParsed={mockOnPlaylistsParsed} />);

    const input = screen.getByTestId('file-input');
    const file = new File(
      [JSON.stringify({ playlists: [] })],
      'Playlist1.json',
      { type: 'application/json' }
    );

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnPlaylistsParsed).toHaveBeenCalled();
    });
  });

  it('handles multiple files', async () => {
    render(<FileDropzone onPlaylistsParsed={mockOnPlaylistsParsed} />);

    const input = screen.getByTestId('file-input');
    const playlistFile = new File(
      [JSON.stringify({ playlists: [] })],
      'Playlist1.json',
      { type: 'application/json' }
    );
    const libraryFile = new File(
      [JSON.stringify({ tracks: [] })],
      'YourLibrary.json',
      { type: 'application/json' }
    );

    Object.defineProperty(input, 'files', {
      value: [playlistFile, libraryFile],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnPlaylistsParsed).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Test Playlist' }),
          expect.objectContaining({ name: 'Liked Songs' }),
        ])
      );
    });
  });

  it('does not call callback when no playlists parsed', async () => {
    render(<FileDropzone onPlaylistsParsed={mockOnPlaylistsParsed} />);

    const input = screen.getByTestId('file-input');
    const file = new File([JSON.stringify({})], 'empty.json', {
      type: 'application/json',
    });

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    // Wait a bit to ensure async operations complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockOnPlaylistsParsed).not.toHaveBeenCalled();
  });
});
