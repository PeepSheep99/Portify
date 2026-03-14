'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface TransferBottomBarProps {
  count: number;
  onTransfer: () => void;
  isAuthenticated: boolean;
  isTransferring: boolean;
}

export function TransferBottomBar({
  count,
  onTransfer,
  isAuthenticated,
  isTransferring,
}: TransferBottomBarProps) {
  // Don't render if no playlists
  if (count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-xl mx-auto px-4 pb-4">
          <button
            onClick={onTransfer}
            disabled={!isAuthenticated || isTransferring}
            className={`
              w-full py-3.5 px-6 rounded-2xl font-semibold text-base
              transition-all duration-300 flex items-center justify-center gap-2
              ${isAuthenticated && !isTransferring
                ? 'bg-[var(--spotify-green)] text-white hover:bg-[var(--spotify-green-light)] active:scale-[0.98] shadow-lg glow-spotify'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]'
              }
            `}
          >
            {isTransferring ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Transferring...
              </>
            ) : isAuthenticated ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                {`Transfer ${count} playlist${count !== 1 ? 's' : ''}`}
              </>
            ) : (
              'Connect YouTube Music first'
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
