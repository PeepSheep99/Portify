import { describe, it, expect } from 'vitest';
import {
  parseSpotifyLibrary,
  parseSpotifyPlaylists,
  parseSpotifyFile,
} from './spotifyParser';
import type {
  SpotifyLibrary,
  SpotifyPlaylistExport,
} from '@/types/spotify';

// Test fixtures
const mockLibraryData: SpotifyLibrary = {
  tracks: [
    { artist: 'Artist One', track: 'Track One', album: 'Album One', uri: 'spotify:track:1' },
    { artist: 'Artist Two', track: 'Track Two', album: 'Album Two' },
    { artist: 'Artist Three', track: 'Track Three' }, // Missing album
  ],
  albums: [{ artist: 'Album Artist', album: 'Saved Album' }],
};

const mockPlaylistData: SpotifyPlaylistExport = {
  playlists: [
    {
      name: 'My Playlist',
      lastModifiedDate: '2026-01-01',
      items: [
        {
          track: {
            trackName: 'Playlist Track 1',
            artistName: 'Playlist Artist 1',
            albumName: 'Playlist Album 1',
            trackUri: 'spotify:track:p1',
          },
          addedDate: '2026-01-01',
        },
        {
          track: {
            trackName: 'Playlist Track 2',
            artistName: 'Playlist Artist 2',
            albumName: 'Playlist Album 2',
          },
        },
      ],
      description: 'A test playlist',
    },
    {
      name: 'Workout Mix',
      items: [
        {
          track: {
            trackName: 'Energy Song',
            artistName: 'Pump Artist',
            albumName: 'Workout Album',
          },
        },
        {
          // Episode item - should be skipped
          episode: {
            episodeName: 'Podcast Episode',
            showName: 'Fitness Podcast',
          },
        },
        {
          track: {
            trackName: 'Another Banger',
            artistName: 'Hype Artist',
            albumName: 'Bangers Album',
          },
        },
      ],
    },
  ],
};

// Mock data with invalid structure
const invalidData = { foo: 'bar' };
const nullData = null;
const emptyObject = {};

describe('parseSpotifyLibrary', () => {
  it('should return ParsedPlaylist with source="liked_songs" for valid library data', () => {
    const result = parseSpotifyLibrary(mockLibraryData);

    expect(result).not.toBeNull();
    expect(result?.source).toBe('liked_songs');
    expect(result?.name).toBe('Liked Songs');
  });

  it('should extract track name, artist, and album from each track', () => {
    const result = parseSpotifyLibrary(mockLibraryData);

    expect(result?.tracks).toHaveLength(3);
    expect(result?.tracks[0]).toEqual({
      name: 'Track One',
      artist: 'Artist One',
      album: 'Album One',
    });
    expect(result?.tracks[1]).toEqual({
      name: 'Track Two',
      artist: 'Artist Two',
      album: 'Album Two',
    });
  });

  it('should handle missing album field with null', () => {
    const result = parseSpotifyLibrary(mockLibraryData);

    expect(result?.tracks[2]).toEqual({
      name: 'Track Three',
      artist: 'Artist Three',
      album: null,
    });
  });

  it('should return null for invalid/non-library data', () => {
    expect(parseSpotifyLibrary(invalidData)).toBeNull();
    expect(parseSpotifyLibrary(nullData)).toBeNull();
    expect(parseSpotifyLibrary(emptyObject)).toBeNull();
    expect(parseSpotifyLibrary({ tracks: 'not an array' })).toBeNull();
  });
});

describe('parseSpotifyPlaylists', () => {
  it('should return array of ParsedPlaylist for valid playlist data', () => {
    const result = parseSpotifyPlaylists(mockPlaylistData);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('My Playlist');
    expect(result[0].source).toBe('playlist');
    expect(result[1].name).toBe('Workout Mix');
    expect(result[1].source).toBe('playlist');
  });

  it('should extract correct tracks with name, artist, album for each playlist', () => {
    const result = parseSpotifyPlaylists(mockPlaylistData);

    expect(result[0].tracks).toHaveLength(2);
    expect(result[0].tracks[0]).toEqual({
      name: 'Playlist Track 1',
      artist: 'Playlist Artist 1',
      album: 'Playlist Album 1',
    });
  });

  it('should skip episodes and only include tracks', () => {
    const result = parseSpotifyPlaylists(mockPlaylistData);

    // Workout Mix has 3 items but one is an episode, so only 2 tracks
    expect(result[1].tracks).toHaveLength(2);
    expect(result[1].tracks[0].name).toBe('Energy Song');
    expect(result[1].tracks[1].name).toBe('Another Banger');
  });

  it('should return empty array for invalid data', () => {
    expect(parseSpotifyPlaylists(invalidData)).toEqual([]);
    expect(parseSpotifyPlaylists(nullData)).toEqual([]);
    expect(parseSpotifyPlaylists(emptyObject)).toEqual([]);
    expect(parseSpotifyPlaylists({ playlists: 'not an array' })).toEqual([]);
  });
});

describe('parseSpotifyFile', () => {
  it('should detect YourLibrary.json and parse as liked songs', () => {
    const result = parseSpotifyFile(mockLibraryData, 'YourLibrary.json');

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('liked_songs');
    expect(result[0].name).toBe('Liked Songs');
  });

  it('should handle case-insensitive filename matching for library', () => {
    const result = parseSpotifyFile(mockLibraryData, 'yourlibrary.json');

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('liked_songs');
  });

  it('should detect Playlist files and parse as playlists', () => {
    const result = parseSpotifyFile(mockPlaylistData, 'Playlist1.json');

    expect(result).toHaveLength(2);
    expect(result[0].source).toBe('playlist');
    expect(result[1].source).toBe('playlist');
  });

  it('should return empty array for unrecognized files with invalid data', () => {
    const result = parseSpotifyFile(invalidData, 'random.json');

    expect(result).toEqual([]);
  });

  it('should use fallback parsing for unrecognized filenames with valid data', () => {
    // Should try both parsers and return library data
    const libraryResult = parseSpotifyFile(mockLibraryData, 'export.json');
    expect(libraryResult).toHaveLength(1);
    expect(libraryResult[0].source).toBe('liked_songs');

    // Should try both parsers and return playlist data
    const playlistResult = parseSpotifyFile(mockPlaylistData, 'data.json');
    expect(playlistResult).toHaveLength(2);
    expect(playlistResult[0].source).toBe('playlist');
  });
});
