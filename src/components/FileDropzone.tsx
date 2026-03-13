'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { parseSpotifyFile } from '@/lib/spotifyParser';
import type { ParsedPlaylist } from '@/types/spotify';

interface FileDropzoneProps {
  onPlaylistsParsed: (playlists: ParsedPlaylist[]) => void;
}

export function FileDropzone({ onPlaylistsParsed }: FileDropzoneProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const allPlaylists: ParsedPlaylist[] = [];

      for (const file of acceptedFiles) {
        try {
          const text = await file.text();
          const jsonData = JSON.parse(text);
          const playlists = parseSpotifyFile(jsonData, file.name);
          allPlaylists.push(...playlists);
        } catch (error) {
          console.error(`Error parsing ${file.name}:`, error);
        }
      }

      if (allPlaylists.length > 0) {
        onPlaylistsParsed(allPlaylists);
      }
    },
    [onPlaylistsParsed]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
    },
    maxFiles: 10,
  });

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600'
      }`}
    >
      <input {...getInputProps()} data-testid="file-input" />
      <div className="space-y-2">
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
          {isDragActive
            ? 'Drop your Spotify files here...'
            : 'Drag and drop Spotify JSON files here'}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          or click to select files
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Supports YourLibrary.json and Playlist1.json from Spotify GDPR export
        </p>
      </div>
    </div>
  );
}
