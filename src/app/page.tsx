'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { PlaylistList } from '@/components/PlaylistList';
import type { ParsedPlaylist } from '@/types/spotify';

export default function Home() {
  const [playlists, setPlaylists] = useState<ParsedPlaylist[]>([]);

  const handlePlaylistsParsed = (newPlaylists: ParsedPlaylist[]) => {
    setPlaylists((prev) => [...prev, ...newPlaylists]);
  };

  const handleClear = () => {
    setPlaylists([]);
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
            Portify
          </h1>
          <p className="mt-2 text-xl text-zinc-600 dark:text-zinc-400">
            Spotify to YouTube Music
          </p>
        </header>

        <main className="space-y-8">
          {/* File upload section */}
          <section>
            <FileDropzone onPlaylistsParsed={handlePlaylistsParsed} />
          </section>

          {/* Clear button when playlists exist */}
          {playlists.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleClear}
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Clear all playlists
              </button>
            </div>
          )}

          {/* Playlist display section */}
          <section>
            <PlaylistList playlists={playlists} />
          </section>
        </main>
      </div>
    </div>
  );
}
