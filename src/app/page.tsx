'use client';

import { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowRight, Trash2 } from 'lucide-react';
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
  const [showDropzone, setShowDropzone] = useState(true);
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);

  const handlePlaylistsParsed = (newPlaylists: ParsedPlaylist[]) => {
    setPlaylists((prev) => [...prev, ...newPlaylists]);
    setShowDropzone(false); // Hide after successful upload
  };

  const handleClear = () => {
    setPlaylists([]);
    setSelectedPlaylists([]);
    setShowDropzone(true); // Show dropzone when all cleared
  };

  const togglePlaylistSelection = (playlistName: string) => {
    setSelectedPlaylists(prev =>
      prev.includes(playlistName)
        ? prev.filter(n => n !== playlistName)
        : [...prev, playlistName]
    );
  };

  const selectAllPlaylists = () => {
    setSelectedPlaylists(playlists.map(p => p.name));
  };

  const deselectAllPlaylists = () => {
    setSelectedPlaylists([]);
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
        // Force immediate render for smooth progress updates
        flushSync(() => {
          setTransferProgress(progress);
        });
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
    <div className="min-h-screen relative">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          {/* Logo - Spotify to YouTube transfer */}
          <div className="inline-flex items-center gap-3 mb-5">
            {/* Spotify icon */}
            <div className="w-14 h-14 rounded-xl bg-[#1db954] flex items-center justify-center shadow-lg shadow-[#1db954]/30">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            {/* Arrow */}
            <ArrowRight className="w-6 h-6 text-[var(--text-muted)]" />
            {/* YouTube Music icon */}
            <div className="w-14 h-14 rounded-xl bg-[#ff0000] flex items-center justify-center shadow-lg shadow-[#ff0000]/30">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            Portify
          </h1>
          <p className="text-base text-[var(--text-secondary)]">
            Transfer your Spotify playlists to YouTube Music
          </p>
        </motion.header>

        <main className="space-y-8">
          {/* YouTube Music Auth */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <YouTubeAuthButton onAuthenticated={handleAuthenticated} />
          </motion.section>

          {/* File upload section */}
          <AnimatePresence mode="wait">
            {showDropzone && (
              <motion.section
                key="dropzone"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FileDropzone onPlaylistsParsed={handlePlaylistsParsed} />
              </motion.section>
            )}
          </AnimatePresence>

          {/* Add more files button (shown when dropzone hidden and playlists exist) */}
          <AnimatePresence>
            {!showDropzone && playlists.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center"
              >
                <button
                  onClick={() => setShowDropzone(true)}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2 glass px-4 py-2 rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Add more files
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clear button when playlists exist */}
          <AnimatePresence>
            {playlists.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-end"
              >
                <button
                  onClick={handleClear}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Playlist display section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <PlaylistList
              playlists={playlists}
              onTransfer={oauthToken ? handleTransfer : undefined}
              transferringPlaylist={transferringPlaylist}
              selectedIds={selectedPlaylists}
              onToggleSelect={togglePlaylistSelection}
              onSelectAll={selectAllPlaylists}
              onDeselectAll={deselectAllPlaylists}
            />
          </motion.section>
        </main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-[var(--text-muted)]">
            Made with <span className="text-red-400">&#9829;</span> by <span className="text-[var(--text-secondary)] font-medium">Navneet</span>
          </p>
        </motion.footer>
      </div>

      {/* Transfer progress modal/overlay */}
      <AnimatePresence>
        {isTransferring && transferProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md"
            >
              <TransferProgress progress={transferProgress} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer results modal */}
      <AnimatePresence>
        {transferResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg"
            >
              <TransferResults result={transferResult} onClose={handleCloseResults} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
