'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload } from 'lucide-react';
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

  const rootProps = getRootProps();

  return (
    <motion.div
      onClick={rootProps.onClick}
      onKeyDown={rootProps.onKeyDown}
      onFocus={rootProps.onFocus}
      onBlur={rootProps.onBlur}
      onDragEnter={rootProps.onDragEnter}
      onDragOver={rootProps.onDragOver}
      onDragLeave={rootProps.onDragLeave}
      onDrop={rootProps.onDrop}
      tabIndex={rootProps.tabIndex}
      role={rootProps.role}
      className={`
        relative cursor-pointer overflow-hidden rounded-2xl p-8 text-center
        transition-all duration-300 ease-out
        ${isDragActive
          ? 'glass-strong scale-[1.02] glow-spotify'
          : 'glass hover:glass-strong'
        }
      `}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Animated border gradient */}
      <div
        className={`
          absolute inset-0 rounded-2xl p-[2px] -z-10
          ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}
          transition-opacity duration-300
        `}
        style={{
          background: isDragActive
            ? 'linear-gradient(135deg, #1db954, #8b5cf6, #ff0000, #1db954)'
            : 'transparent',
          backgroundSize: '300% 300%',
          animation: isDragActive ? 'gradient-shift 2s ease infinite' : 'none',
        }}
      />

      <input {...getInputProps()} data-testid="file-input" />

      <div className="relative z-10 space-y-4">
        {/* Upload icon */}
        <motion.div
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center glass-strong"
          animate={isDragActive ? { scale: [1, 1.1, 1], y: [0, -5, 0] } : {}}
          transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
        >
          <Upload
            className={`w-8 h-8 transition-colors duration-300 ${
              isDragActive ? 'text-[#1db954]' : 'text-white/70'
            }`}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={isDragActive ? 'active' : 'inactive'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-lg font-medium text-white/90">
              {isDragActive
                ? 'Drop your Spotify files here...'
                : 'Drag and drop Spotify JSON files'}
            </p>
          </motion.div>
        </AnimatePresence>

        <p className="text-sm text-white/60">
          or click to select files
        </p>

        {/* How to get files */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40 mb-2">How to get your Spotify data:</p>
          <ol className="text-xs text-white/30 space-y-1 text-left max-w-xs mx-auto">
            <li className="flex items-start gap-2">
              <span className="text-white/50">1.</span>
              <span>Go to <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noopener noreferrer" className="text-[#1db954] hover:underline">Spotify Privacy Settings</a></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white/50">2.</span>
              <span>Request your data (Extended streaming history)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white/50">3.</span>
              <span>Upload <code className="px-1 py-0.5 rounded bg-white/10">Playlist1.json</code> or <code className="px-1 py-0.5 rounded bg-white/10">YourLibrary.json</code></span>
            </li>
          </ol>
        </div>
      </div>
    </motion.div>
  );
}
