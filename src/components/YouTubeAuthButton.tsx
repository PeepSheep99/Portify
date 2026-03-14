'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Check, RefreshCw } from 'lucide-react';
import { startAuth, pollAuth } from '@/lib/youtubeMusic';
import type { AuthStatus, DeviceAuthResponse } from '@/types/youtube';

const STORAGE_KEY = 'portify_oauth_token';

interface YouTubeAuthButtonProps {
  onAuthenticated: (token: string) => void;
  isAuthenticated?: boolean;
}

export function YouTubeAuthButton({ onAuthenticated, isAuthenticated = false }: YouTubeAuthButtonProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(isAuthenticated ? 'connected' : 'disconnected');
  const [deviceInfo, setDeviceInfo] = useState<DeviceAuthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [googleOpened, setGoogleOpened] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const expirationRef = useRef<number>(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Derive the effective status: prop takes precedence when authenticated
  // This avoids syncing state from props (anti-pattern) and ensures
  // the UI always reflects the actual auth state from the parent
  const effectiveStatus = isAuthenticated ? 'connected' : authStatus;

  // Clear error when authenticated (derived, no useEffect needed)
  const displayError = isAuthenticated ? null : error;

  // Clean up polling and countdown on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
  }, []);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      return true;
    } catch {
      return false;
    }
  };

  const handleConnect = async () => {
    setError(null);
    setAuthStatus('pending');
    setGoogleOpened(false);

    try {
      const response = await startAuth();
      setDeviceInfo(response);
      expirationRef.current = Date.now() + response.expires_in * 1000;

      // AUTO-COPY the code first
      await copyToClipboard(response.user_code);

      // Start 5-second countdown before opening Google tab
      setCountdown(5);

      const runCountdown = (count: number) => {
        if (count > 0) {
          countdownRef.current = setTimeout(() => {
            setCountdown(count - 1);
            runCountdown(count - 1);
          }, 1000);
        } else {
          // Try to open Google tab when countdown reaches 0
          const popup = window.open(response.verification_url, '_blank', 'noopener,noreferrer');
          // Detect if popup was blocked (common on mobile browsers)
          if (!popup || popup.closed) {
            setPopupBlocked(true);
          } else {
            setGoogleOpened(true);
          }
          setCountdown(null);
        }
      };
      runCountdown(5);

      // Start polling at the interval specified by Google
      const pollInterval = (response.interval || 5) * 1000;
      pollIntervalRef.current = setInterval(async () => {
        // Stop polling if expired
        if (Date.now() >= expirationRef.current) {
          stopPolling();
          setAuthStatus('disconnected');
          setDeviceInfo(null);
          setError('Session expired. Please try again.');
          return;
        }

        try {
          const pollResult = await pollAuth(response.device_code);

          if (pollResult.status === 'complete' && pollResult.token) {
            stopPolling();
            setAuthStatus('connected');
            // Persist token to localStorage
            try {
              localStorage.setItem(STORAGE_KEY, pollResult.token);
            } catch {
              // localStorage might be unavailable (private browsing, etc.)
            }
            onAuthenticated(pollResult.token);
          } else if (pollResult.status === 'error') {
            stopPolling();
            setAuthStatus('disconnected');
            setDeviceInfo(null);
            setError(pollResult.error || 'Authentication failed');
          }
          // If pending, continue polling
        } catch (err) {
          stopPolling();
          setAuthStatus('disconnected');
          setDeviceInfo(null);
          setError(err instanceof Error ? err.message : 'Connection failed');
        }
      }, pollInterval);
    } catch (err) {
      setAuthStatus('disconnected');
      setError(err instanceof Error ? err.message : 'Failed to start');
    }
  };

  const handleOpenGoogle = () => {
    if (deviceInfo?.verification_url) {
      // User-initiated click won't be blocked
      window.open(deviceInfo.verification_url, '_blank', 'noopener,noreferrer');
      setGoogleOpened(true);
      setPopupBlocked(false);
    }
  };

  const handleCancel = () => {
    stopCountdown();
    stopPolling();
    setAuthStatus('disconnected');
    setDeviceInfo(null);
    setGoogleOpened(false);
    setPopupBlocked(false);
  };

  return (
    <AnimatePresence mode="wait">
      {/* Disconnected state: show connect button */}
      {effectiveStatus === 'disconnected' && (
        <motion.div
          key="disconnected"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-2"
        >
          <motion.button
            onClick={handleConnect}
            className="relative w-full overflow-hidden rounded-2xl p-4 font-semibold text-white transition-all duration-300 group"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.15) 0%, rgba(26, 26, 36, 0.9) 100%)',
              border: '1px solid rgba(255, 0, 0, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255, 0, 0, 0.2)' }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-3">
              {/* YouTube icon */}
              <div className="w-10 h-10 rounded-xl bg-[var(--youtube-red)] flex items-center justify-center shadow-lg group-hover:shadow-[var(--youtube-red)]/30 transition-shadow">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <span className="text-base">Connect YouTube Music</span>
            </div>
          </motion.button>

          {displayError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-red-400"
            >
              {displayError}
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Pending state: show instructions */}
      {effectiveStatus === 'pending' && deviceInfo && (
        <motion.div
          key="pending"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-strong rounded-2xl p-5"
        >
          <div className="space-y-4">
            {/* Status message - different for countdown vs waiting vs blocked */}
            <div className="text-center">
              {countdown !== null ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-[var(--spotify-green)]" />
                    <span className="text-[var(--spotify-green)] font-medium">Code copied to clipboard</span>
                  </div>
                  <p className="text-[var(--text-primary)] font-medium">
                    Opening Google sign-in in <span className="text-[var(--accent)] font-bold">{countdown}</span> seconds...
                  </p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Just paste the code when the page opens
                  </p>
                </>
              ) : popupBlocked ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-[var(--spotify-green)]" />
                    <span className="text-[var(--spotify-green)] font-medium">Code copied to clipboard</span>
                  </div>
                  <p className="text-base font-medium text-[var(--text-primary)]">
                    Tap the button below to sign in
                  </p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Your browser blocked the automatic popup
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-medium text-[var(--text-primary)]">
                    Paste this code in the Google sign-in page
                  </p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {googleOpened ? 'We opened a sign-in tab for you' : 'Opening sign-in page...'}
                  </p>
                </>
              )}
            </div>

            {/* Code display - always show checkmark during pending state */}
            <div className="flex items-center justify-center gap-2">
              <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
                <span className="font-mono text-2xl font-bold tracking-wider text-white">
                  {deviceInfo.user_code}
                </span>
                <div className="w-6 h-6 rounded-full bg-[var(--spotify-green)]/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[var(--spotify-green)]" />
                </div>
              </div>
            </div>

            {/* Waiting indicator - only show after Google opened */}
            {!countdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-[var(--text-muted)]"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
                <span className="text-sm">Waiting for you to complete sign-in...</span>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col items-center gap-3 pt-2">
              {/* Prominent button when popup was blocked (mobile) */}
              {popupBlocked && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleOpenGoogle}
                  className="w-full py-3 px-4 rounded-xl bg-[var(--youtube-red)] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[var(--youtube-red)]/90 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Google Sign-in
                </motion.button>
              )}

              <div className="flex items-center justify-center gap-3">
                {/* Only show "Reopen" link after countdown finishes and popup wasn't blocked */}
                {!countdown && !popupBlocked && (
                  <>
                    <button
                      onClick={handleOpenGoogle}
                      className="text-sm text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors inline-flex items-center gap-1.5 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Reopen sign-in page
                    </button>
                    <span className="text-[var(--text-muted)]">·</span>
                  </>
                )}
                <button
                  onClick={handleCancel}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Connected state: show success with green glow */}
      {effectiveStatus === 'connected' && (
        <motion.div
          key="connected"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-4 glow-connected border-[var(--spotify-green)]/30"
        >
          <div className="flex items-center justify-center gap-3">
            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-10 h-10 rounded-full bg-[var(--spotify-green)]/20 flex items-center justify-center"
            >
              <Check className="w-6 h-6 text-[var(--spotify-green)]" />
            </motion.div>
            <div>
              <span className="font-semibold text-[var(--spotify-green)] block">
                YouTube Music Connected
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                Ready to transfer your playlists
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
