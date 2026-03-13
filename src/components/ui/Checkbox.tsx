'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <motion.button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onChange();
        }}
        disabled={disabled}
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center
          transition-colors
          ${checked
            ? 'bg-[#1db954] border-[#1db954]'
            : 'border-white/30 hover:border-white/50'
          }
          ${disabled ? '' : 'focus:outline-none focus:ring-2 focus:ring-[#1db954]/50'}
        `}
        whileTap={disabled ? undefined : { scale: 0.9 }}
      >
        <motion.div
          initial={false}
          animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        </motion.div>
      </motion.button>
      {label && (
        <span className="text-white/80 group-hover:text-white transition-colors">
          {label}
        </span>
      )}
    </label>
  );
}
