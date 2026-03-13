'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { startAuth, pollAuth } from '@/lib/youtubeMusic';
import type { AuthStatus, DeviceAuthResponse } from '@/types/youtube';

interface YouTubeAuthButtonProps {
  onAuthenticated: (token: string) => void;
}

export function YouTubeAuthButton({ onAuthenticated }: YouTubeAuthButtonProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('disconnected');
  const [deviceInfo, setDeviceInfo] = useState<DeviceAuthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const handleConnect = async () => {
    setError(null);
    setAuthStatus('pending');

    try {
      const response = await startAuth();
      setDeviceInfo(response);

      // Start polling at the interval specified by Google
      const pollInterval = (response.interval || 5) * 1000;
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollResult = await pollAuth(response.device_code);

          if (pollResult.status === 'complete' && pollResult.token) {
            stopPolling();
            setAuthStatus('connected');
            onAuthenticated(pollResult.token);
          } else if (pollResult.status === 'error') {
            stopPolling();
            setAuthStatus('disconnected');
            setError(pollResult.error || 'Authentication failed');
          }
          // If pending, continue polling
        } catch (err) {
          stopPolling();
          setAuthStatus('disconnected');
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

  // Disconnected state: show connect button
  if (authStatus === 'disconnected') {
    return (
      <div className="space-y-2">
        <button
          onClick={handleConnect}
          className="w-full rounded-lg border-2 border-red-500 bg-red-50 px-6 py-3 font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-400 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
        >
          Connect YouTube Music
        </button>
        {error && (
          <p className="text-center text-sm text-red-500 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Pending state: show device code and instructions
  if (authStatus === 'pending' && deviceInfo) {
    return (
      <div className="rounded-lg border-2 border-amber-500 bg-amber-50 p-6 dark:border-amber-400 dark:bg-amber-950">
        <div className="space-y-4 text-center">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Enter this code at Google:
          </p>

          <button
            onClick={handleCopyCode}
            className="mx-auto block cursor-pointer select-all rounded bg-white px-4 py-2 font-mono text-2xl font-bold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            title="Click to copy"
          >
            {deviceInfo.user_code}
          </button>

          <a
            href={deviceInfo.verification_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {deviceInfo.verification_url}
          </a>

          <p className="text-xs text-amber-600 dark:text-amber-400">
            Waiting for authentication...
          </p>
        </div>
      </div>
    );
  }

  // Connected state: show success
  if (authStatus === 'connected') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-green-500 bg-green-50 p-4 dark:border-green-400 dark:bg-green-950">
        <svg
          className="h-6 w-6 text-green-500 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span className="font-medium text-green-700 dark:text-green-300">
          YouTube Music Connected
        </span>
      </div>
    );
  }

  return null;
}
