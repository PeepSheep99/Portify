'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { PlaylistList } from '@/components/PlaylistList';
import { YouTubeAuthButton } from '@/components/YouTubeAuthButton';
import { TransferProgress } from '@/components/TransferProgress';
import { TransferResults } from '@/components/TransferResults';
import { transferPlaylist } from '@/lib/youtubeMusic';
import type { ParsedPlaylist } from '@/types/spotify';
import type {
  TransferProgress as TransferProgressType,
  TransferResult,
} from '@/types/transfer';

export default function Home() {
  const [playlists, setPlaylists] = useState<ParsedPlaylist[]>([]);
  const [oauthToken, setOauthToken] = useState<string | null>(null);
  const [transferProgress, setTransferProgress] =
    useState<TransferProgressType | null>(null);
  const [transferResult, setTransferResult] = useState<TransferResult | null>(
    null
  );
  const [transferringPlaylist, setTransferringPlaylist] =
    useState<ParsedPlaylist | null>(null);

  const handlePlaylistsParsed = (newPlaylists: ParsedPlaylist[]) => {
    setPlaylists((prev) => [...prev, ...newPlaylists]);
  };

  const handleClear = () => {
    setPlaylists([]);
  };

  const handleAuthenticated = (token: string) => {
    setOauthToken(token);
  };

  const handleTransfer = async (playlist: ParsedPlaylist) => {
    if (!oauthToken) return;

    setTransferringPlaylist(playlist);
    setTransferProgress({
      current: 0,
      total: playlist.tracks.length,
      phase: 'matching',
      status: 'in_progress',
    });
    setTransferResult(null);

    try {
      const result = await transferPlaylist(oauthToken, playlist, (progress) => {
        setTransferProgress(progress);
      });
      setTransferResult(result);
      setTransferProgress({
        current: playlist.tracks.length,
        total: playlist.tracks.length,
        phase: 'adding',
        status: 'complete',
      });
    } catch (error) {
      setTransferProgress({
        current: 0,
        total: 0,
        phase: 'matching',
        status: 'error',
        error: error instanceof Error ? error.message : 'Transfer failed',
      });
    } finally {
      setTransferringPlaylist(null);
    }
  };

  const handleCloseResults = () => {
    setTransferResult(null);
    setTransferProgress(null);
  };

  const isTransferring = transferringPlaylist !== null;

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
          {/* YouTube Music Auth */}
          <section>
            <YouTubeAuthButton onAuthenticated={handleAuthenticated} />
          </section>

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
            <PlaylistList
              playlists={playlists}
              onTransfer={oauthToken ? handleTransfer : undefined}
              transferringPlaylist={transferringPlaylist}
            />
          </section>
        </main>
      </div>

      {/* Transfer progress modal/overlay */}
      {isTransferring && transferProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md">
            <TransferProgress progress={transferProgress} />
          </div>
        </div>
      )}

      {/* Transfer results modal */}
      {transferResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg">
            <TransferResults result={transferResult} onClose={handleCloseResults} />
          </div>
        </div>
      )}
    </div>
  );
}
