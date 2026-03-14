'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, HelpCircle, ExternalLink, ChevronDown } from 'lucide-react';
import { parseSpotifyFile } from '@/lib/spotifyParser';
import type { ParsedPlaylist } from '@/types/spotify';

interface FileDropzoneProps {
  onPlaylistsParsed: (playlists: ParsedPlaylist[]) => void;
}

export function FileDropzone({ onPlaylistsParsed }: FileDropzoneProps) {
  const [showHelp, setShowHelp] = useState(false);

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
    <div className="space-y-3">
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
          relative cursor-pointer overflow-hidden rounded-2xl p-6 text-center
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
        <input {...getInputProps()} data-testid="file-input" />

        <div className="relative z-10 flex flex-col items-center gap-3">
          {/* Upload icon */}
          <motion.div
            className="w-14 h-14 rounded-xl flex items-center justify-center glass-strong"
            animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
          >
            <Upload
              className={`w-7 h-7 transition-colors duration-300 ${
                isDragActive ? 'text-[var(--spotify-green)]' : 'text-[var(--text-secondary)]'
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
              <p className="text-lg font-semibold text-white">
                {isDragActive
                  ? 'Drop files here...'
                  : 'Upload your Spotify data export'}
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Drop files or click to browse
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Collapsible help section */}
      <div className="glass rounded-xl overflow-hidden">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              How do I get my Spotify data?
            </span>
          </div>
          <motion.span
            animate={{ rotate: showHelp ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-[var(--text-muted)]"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.span>
        </button>

        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[var(--border)]">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--spotify-green)]/20 text-[var(--spotify-green)] text-xs font-bold flex items-center justify-center">1</span>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Go to your{' '}
                      <a
                        href="https://www.spotify.com/account/privacy/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--spotify-green)] hover:underline inline-flex items-center gap-1"
                      >
                        Spotify Privacy Settings
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--spotify-green)]/20 text-[var(--spotify-green)] text-xs font-bold flex items-center justify-center">2</span>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Scroll to &quot;Download your data&quot; and request <span className="text-white font-medium">Extended streaming history</span>
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Spotify will email you a download link (usually takes a few days)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--spotify-green)]/20 text-[var(--spotify-green)] text-xs font-bold flex items-center justify-center">3</span>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Extract the ZIP and drag the <span className="text-white font-medium">.json files</span> here
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      We&apos;ll find your playlists and liked songs automatically
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
