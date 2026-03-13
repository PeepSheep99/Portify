// Spotify GDPR Export JSON Types
// Source: Reverse-engineered from Spotify GDPR export samples

// YourLibrary.json structure
export interface SpotifyLibrary {
  tracks: SpotifyTrack[];
  albums?: SpotifyAlbum[];
  shows?: SpotifyShow[];
  episodes?: SpotifyEpisode[];
  bannedTracks?: SpotifyTrack[];
  other?: unknown;
}

export interface SpotifyTrack {
  artist: string; // Artist name
  track: string; // Track title
  album?: string; // Album name (not always present)
  uri?: string; // spotify:track:xxxxx (not always present)
}

export interface SpotifyAlbum {
  artist: string;
  album: string;
  uri?: string;
}

export interface SpotifyShow {
  name: string;
  publisher: string;
  uri?: string;
}

export interface SpotifyEpisode {
  name: string;
  show: string;
  uri?: string;
}

// Playlist1.json structure
export interface SpotifyPlaylistExport {
  playlists: SpotifyPlaylist[];
}

export interface SpotifyPlaylist {
  name: string;
  lastModifiedDate?: string;
  items: SpotifyPlaylistItem[];
  description?: string;
  numberOfFollowers?: number;
}

export interface SpotifyPlaylistItem {
  track?: {
    trackName: string;
    artistName: string;
    albumName: string;
    trackUri?: string;
  };
  episode?: {
    episodeName: string;
    showName: string;
  };
  localTrack?: {
    trackName: string;
    artistName: string;
    albumName: string;
  };
  addedDate?: string;
}

// Unified format for app usage
export interface ParsedPlaylist {
  name: string;
  tracks: ParsedTrack[];
  source: 'playlist' | 'liked_songs';
}

export interface ParsedTrack {
  name: string;
  artist: string;
  album: string | null;
}
