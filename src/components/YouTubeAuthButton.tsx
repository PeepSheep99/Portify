'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Copy } from 'lucide-react';
import { startAuth, pollAuth } from '@/lib/youtubeMusic';
import type { AuthStatus, DeviceAuthResponse } from '@/types/youtube';

interface YouTubeAuthButtonProps {
  onAuthenticated: (token: string) => void;
}

export function YouTubeAuthButton({ onAuthenticated }: YouTubeAuthButtonProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('disconnected');
  const [deviceInfo, setDeviceInfo] = useState<DeviceAuthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling and countdown on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setTimeRemaining(null);
  }, []);

  const handleConnect = async () => {
    setError(null);
    setAuthStatus('pending');

    try {
      const response = await startAuth();
      setDeviceInfo(response);

      // Set expiration time
      const expiration = Date.now() + response.expires_in * 1000;
      setTimeRemaining(response.expires_in);

      // Start countdown timer (updates every second)
      countdownIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.floor((expiration - Date.now()) / 1000));
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          stopPolling();
          setAuthStatus('disconnected');
          setDeviceInfo(null);
          setError('Code expired. Please try again.');
        }
      }, 1000);

      // Start polling at the interval specified by Google
      const pollInterval = (response.interval || 5) * 1000;
      pollIntervalRef.current = setInterval(async () => {
        // Stop polling if expired
        if (Date.now() >= expiration) {
          return;
        }

        try {
          const pollResult = await pollAuth(response.device_code);

          if (pollResult.status === 'complete' && pollResult.token) {
            stopPolling();
            setAuthStatus('connected');
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
          setError(err instanceof Error ? err.message : 'Polling failed');
        }
      }, pollInterval);
    } catch (err) {
      setAuthStatus('disconnected');
      setError(err instanceof Error ? err.message : 'Failed to start authentication');
    }
  };

  const handleCopyCode = () => {
    if (deviceInfo?.user_code) {
      navigator.clipboard.writeText(deviceInfo.user_code);
    }
  };

  // Calculate progress for circular timer
  const progress = timeRemaining !== null && deviceInfo
    ? (timeRemaining / deviceInfo.expires_in) * 100
    : 100;

  // Get urgency color based on time remaining
  const getUrgencyColor = () => {
    if (progress > 50) return '#22c55e'; // green
    if (progress > 20) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <AnimatePresence mode="wait">
      {/* Disconnected state: show connect button */}
      {authStatus === 'disconnected' && (
        <motion.div
          key="disconnected"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          <motion.button
            onClick={handleConnect}
            className="relative w-full overflow-hidden rounded-2xl glass-strong p-4 font-medium text-white transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-2xl border-2 border-red-500/50 animate-pulse-ring" />

            {/* Gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />

            <div className="relative flex items-center justify-center gap-3">
              {/* YouTube icon */}
              <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span className="text-lg">Connect YouTube Music</span>
            </div>
          </motion.button>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Pending state: show device code and instructions */}
      {authStatus === 'pending' && deviceInfo && (
        <motion.div
          key="pending"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-strong rounded-2xl p-6"
        >
          <div className="space-y-5 text-center">
            {/* Circular progress timer */}
            <div className="relative mx-auto w-20 h-20">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke={getUrgencyColor()}
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={226}
                  strokeDashoffset={226 - (226 * progress) / 100}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              {/* Time remaining text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-mono text-white/80">
                  {timeRemaining !== null
                    ? `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}`
                    : '--:--'}
                </span>
              </div>
            </div>

            <p className="text-sm text-white/70">
              Enter this code at Google:
            </p>

            {/* Device code with glass styling */}
            <motion.button
              onClick={handleCopyCode}
              className="group mx-auto flex items-center gap-2 glass rounded-xl px-5 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="font-mono text-3xl font-bold tracking-widest text-white">
                {deviceInfo.user_code}
              </span>
              <Copy className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
            </motion.button>

            <a
              href={deviceInfo.verification_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>{deviceInfo.verification_url}</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Loading dots */}
            <div className="flex items-center justify-center gap-1.5 pt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-white/40"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Connected state: show success */}
      {authStatus === 'connected' && (
        <motion.div
          key="connected"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-4 glow-success"
        >
          <div className="flex items-center justify-center gap-3">
            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <motion.svg
                className="w-5 h-5 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </motion.div>
            <span className="font-medium text-green-400">
              YouTube Music Connected
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
