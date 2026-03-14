'use client';

import { useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  gravity?: number;
  origin?: { x?: number; y?: number };
}

export function useConfetti() {
  const fire = useCallback((options: ConfettiOptions = {}) => {
    const defaults: ConfettiOptions = {
      particleCount: 150,
      spread: 70,
      startVelocity: 30,
      decay: 0.94,
      gravity: 1,
      origin: { y: 0.6 },
    };

    const config = { ...defaults, ...options };

    // Brand colors
    const colors = ['#1db954', '#ff0000', '#8b5cf6', '#3b82f6', '#ec4899', '#f59e0b'];

    // Fire confetti burst
    confetti({
      ...config,
      colors,
      shapes: ['square', 'circle'],
      ticks: 200,
    });

    // Secondary burst for more drama
    setTimeout(() => {
      confetti({
        ...config,
        particleCount: Math.floor((config.particleCount || 150) * 0.5),
        spread: (config.spread || 70) * 1.2,
        startVelocity: 25,
        colors,
        shapes: ['square', 'circle'],
        ticks: 150,
      });
    }, 150);
  }, []);

  const fireFromElement = useCallback((element: HTMLElement, options: ConfettiOptions = {}) => {
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    fire({
      ...options,
      origin: { x, y },
    });
  }, [fire]);

  return { fire, fireFromElement };
}

// Component that fires confetti on mount
interface ConfettiCelebrationProps {
  trigger?: boolean;
  options?: ConfettiOptions;
}

export function ConfettiCelebration({ trigger = true, options }: ConfettiCelebrationProps) {
  const hasFired = useRef(false);
  const { fire } = useConfetti();

  useEffect(() => {
    if (trigger && !hasFired.current) {
      hasFired.current = true;
      // Small delay for visual effect
      const timer = setTimeout(() => fire(options), 100);
      return () => clearTimeout(timer);
    }
  }, [trigger, fire, options]);

  // Reset when trigger becomes false
  useEffect(() => {
    if (!trigger) {
      hasFired.current = false;
    }
  }, [trigger]);

  return null;
}
