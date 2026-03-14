'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1.5,
  formatFn = (n) => Math.round(n).toString(),
  className = '',
}: AnimatedNumberProps) {
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => formatFn(current));
  const [displayValue, setDisplayValue] = useState(formatFn(0));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [display]);

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}

// Percentage variant with % suffix
export function AnimatedPercentage({
  value,
  duration = 1.5,
  className = '',
}: Omit<AnimatedNumberProps, 'formatFn'>) {
  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      formatFn={(n) => `${Math.round(n)}%`}
      className={className}
    />
  );
}
