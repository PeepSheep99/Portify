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
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-2xl mx-auto p-4">
          <button
            onClick={onTransfer}
            disabled={!isAuthenticated || isTransferring}
            className={`
              w-full py-3 px-6 rounded-xl font-medium text-white
              transition-all duration-200
              ${isAuthenticated && !isTransferring
                ? 'bg-[#1db954] hover:bg-[#1ed760] active:scale-[0.98]'
                : 'bg-gray-300 cursor-not-allowed'
              }
            `}
          >
            {isTransferring
              ? 'Transferring...'
              : isAuthenticated
                ? `Transfer ${count} playlist${count !== 1 ? 's' : ''} to YouTube Music`
                : 'Connect YouTube Music to transfer'
            }
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
