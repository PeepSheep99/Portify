'use client';

import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';

const STORAGE_KEY = 'portify_oauth_token';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowRight, Trash2 } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { PlaylistList } from '@/components/PlaylistList';
import { YouTubeAuthButton } from '@/components/YouTubeAuthButton';
import { TransferProgress } from '@/components/TransferProgress';
import { TransferResults } from '@/components/TransferResults';
import { TransferBottomBar } from '@/components/TransferBottomBar';
import { transferPlaylist, AuthError } from '@/lib/youtubeMusic';
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
  const [excludedPlaylists, setExcludedPlaylists] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Restore OAuth token from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(STORAGE_KEY);
      if (storedToken) {
        setOauthToken(storedToken);
      }
    } catch {
      // localStorage might be unavailable
    }
  }, []);

  const handlePlaylistsParsed = (newPlaylists: ParsedPlaylist[]) => {
    setPlaylists((prev) => [...prev, ...newPlaylists]);
    setShowDropzone(false); // Hide after successful upload
  };

  const handleClear = () => {
    setPlaylists([]);
    setExcludedPlaylists(new Set());
    setShowDropzone(true); // Show dropzone when all cleared
  };

  const toggleExclusion = (playlistName: string) => {
    setExcludedPlaylists(prev => {
      const next = new Set(prev);
      if (next.has(playlistName)) {
        next.delete(playlistName);
      } else {
        next.add(playlistName);
      }
      return next;
    });
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
      // Handle expired/invalid token by clearing auth state
      if (error instanceof AuthError) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // localStorage might be unavailable
        }
        setOauthToken(null);
      }

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
    // Clear playlists and return to default state after viewing results
    setPlaylists([]);
    setExcludedPlaylists(new Set());
    setShowDropzone(true);
  };

  const handleBatchTransfer = async () => {
    const playlistsToTransfer = playlists.filter(p => !excludedPlaylists.has(p.name));
    const total = playlistsToTransfer.length;

    // Transfer ALL playlists sequentially with progress tracking
    for (let i = 0; i < playlistsToTransfer.length; i++) {
      setBatchProgress({ current: i + 1, total });
      await handleTransfer(playlistsToTransfer[i]);
    }

    setBatchProgress(null);
  };

  const selectedCount = playlists.length - excludedPlaylists.size;
  const isTransferring = transferringPlaylist !== null;

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="mx-auto max-w-xl w-full px-4 py-6 sm:py-8 flex-1 flex flex-col">
        {/* Header - Compact */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          {/* Logo - Spotify to YouTube transfer */}
          <div className="inline-flex items-center gap-3 mb-3">
            {/* Spotify icon */}
            <div className="w-12 h-12 rounded-xl bg-[#1db954] flex items-center justify-center shadow-lg shadow-[#1db954]/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            {/* Arrow */}
            <ArrowRight className="w-5 h-5 text-[var(--text-muted)]" />
            {/* YouTube Music icon */}
            <div className="w-12 h-12 rounded-xl bg-[#ff0000] flex items-center justify-center shadow-lg shadow-[#ff0000]/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-1">
            Portify
          </h1>
          <p className="text-base text-[var(--text-secondary)]">
            Move your music library in minutes
          </p>
        </motion.header>

        <main className="space-y-4 flex-1">
          {/* Step 1: File upload section - comes first! */}
          <AnimatePresence mode="wait">
            {showDropzone && (
              <motion.section
                key="dropzone"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
              >
                {playlists.length === 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full gradient-spotify text-white text-xs font-bold flex items-center justify-center shadow-sm">1</span>
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Upload your Spotify data</span>
                  </div>
                )}
                <FileDropzone onPlaylistsParsed={handlePlaylistsParsed} />
              </motion.section>
            )}
          </AnimatePresence>

          {/* Step 2: YouTube Music Auth */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: playlists.length > 0 ? 0 : 0.1 }}
          >
            {playlists.length === 0 && !oauthToken && (
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] text-xs font-bold flex items-center justify-center">2</span>
                <span className="text-sm font-medium text-[var(--text-muted)]">Connect YouTube Music</span>
              </div>
            )}
            {playlists.length > 0 && !oauthToken && (
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full gradient-youtube text-white text-xs font-bold flex items-center justify-center shadow-sm">2</span>
                <span className="text-sm font-medium text-[var(--text-secondary)]">Connect YouTube Music</span>
              </div>
            )}
            <YouTubeAuthButton onAuthenticated={handleAuthenticated} isAuthenticated={!!oauthToken} />
          </motion.section>

          {/* Controls row when playlists exist */}
          <AnimatePresence>
            {playlists.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-between items-center"
              >
                {!showDropzone ? (
                  <button
                    onClick={() => setShowDropzone(true)}
                    className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors flex items-center gap-2 glass px-3 py-2 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add more
                  </button>
                ) : <div />}
                <button
                  onClick={handleClear}
                  className="text-sm text-[var(--text-muted)] hover:text-red-400 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Playlist display section - only show if playlists exist */}
          {playlists.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PlaylistList
                playlists={playlists}
                excludedIds={Array.from(excludedPlaylists)}
                onToggleExclude={toggleExclusion}
                transferringPlaylist={transferringPlaylist}
              />
            </motion.section>
          )}
        </main>

        {/* Fixed bottom transfer bar */}
        {playlists.length > 0 && (
          <TransferBottomBar
            count={selectedCount}
            onTransfer={handleBatchTransfer}
            isAuthenticated={!!oauthToken}
            isTransferring={isTransferring}
          />
        )}

        {/* Footer - only show when no playlists loaded */}
        {playlists.length === 0 && (
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-auto pt-4 text-center"
          >
            <p className="text-sm text-[var(--text-muted)]">
              Made with <span className="text-red-500">&#9829;</span> by <span className="text-[var(--text-secondary)]">Navneet</span>
            </p>
          </motion.footer>
        )}
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
              <TransferProgress
                progress={transferProgress}
                playlistName={transferringPlaylist?.name}
                batchProgress={batchProgress}
              />
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
              <TransferResults
                result={transferResult}
                onClose={handleCloseResults}
                batchProgress={batchProgress}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
