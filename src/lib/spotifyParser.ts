import type {
  SpotifyLibrary,
  SpotifyPlaylistExport,
  ParsedPlaylist,
  ParsedTrack,
} from '@/types/spotify';

/**
 * Type guard to validate SpotifyLibrary structure
 */
function isSpotifyLibrary(data: unknown): data is SpotifyLibrary {
  return (
    typeof data === 'object' &&
    data !== null &&
    'tracks' in data &&
    Array.isArray((data as SpotifyLibrary).tracks)
  );
}

/**
 * Type guard to validate SpotifyPlaylistExport structure
 */
function isSpotifyPlaylistExport(data: unknown): data is SpotifyPlaylistExport {
  return (
    typeof data === 'object' &&
    data !== null &&
    'playlists' in data &&
    Array.isArray((data as SpotifyPlaylistExport).playlists)
  );
}

/**
 * Parse Spotify YourLibrary.json data (liked songs)
 * @param data - Unknown JSON data to parse
 * @returns ParsedPlaylist with source='liked_songs' or null if invalid
 */
export function parseSpotifyLibrary(data: unknown): ParsedPlaylist | null {
  if (!isSpotifyLibrary(data)) {
    return null;
  }

  const tracks: ParsedTrack[] = data.tracks.map((t) => ({
    name: t.track,
    artist: t.artist,
    album: t.album ?? null,
  }));

  return {
    name: 'Liked Songs',
    tracks,
    source: 'liked_songs',
  };
}

/**
 * Parse Spotify Playlist1.json data (playlists)
 * @param data - Unknown JSON data to parse
 * @returns Array of ParsedPlaylist or empty array if invalid
 */
export function parseSpotifyPlaylists(data: unknown): ParsedPlaylist[] {
  if (!isSpotifyPlaylistExport(data)) {
    return [];
  }

  return data.playlists.map((playlist) => ({
    name: playlist.name,
    source: 'playlist' as const,
    tracks: playlist.items
      .filter((item) => item.track) // Skip episodes and other non-track items
      .map((item) => ({
        name: item.track!.trackName,
        artist: item.track!.artistName,
        album: item.track!.albumName ?? null,
      })),
  }));
}

/**
 * Parse Spotify export file based on filename
 * Detects file type from filename and calls appropriate parser
 * @param jsonData - Parsed JSON data from file
 * @param filename - Original filename to detect file type
 * @returns Array of ParsedPlaylist
 */
export function parseSpotifyFile(
  jsonData: unknown,
  filename: string
): ParsedPlaylist[] {
  const lowerFilename = filename.toLowerCase();

  // YourLibrary.json contains liked songs
  if (lowerFilename.includes('yourlibrary')) {
    const library = parseSpotifyLibrary(jsonData);
    return library ? [library] : [];
  }

  // Playlist files (Playlist1.json, etc.)
  if (lowerFilename.includes('playlist')) {
    return parseSpotifyPlaylists(jsonData);
  }

  // Fallback: try both parsers for unrecognized filenames
  const library = parseSpotifyLibrary(jsonData);
  if (library) {
    return [library];
  }

  const playlists = parseSpotifyPlaylists(jsonData);
  if (playlists.length > 0) {
    return playlists;
  }

  return [];
}
