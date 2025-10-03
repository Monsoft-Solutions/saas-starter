'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for the AnimatedWordSwap component
 */
type AnimatedWordSwapProps = {
  words: string[];
  className?: string;
  interval?: number;
};

/**
 * Animated word swapping component inspired by Notion's hero sections.
 * Smoothly cycles through different words with fade animations.
 */
export function AnimatedWordSwap({
  words,
  className,
  interval = 3000,
}: AnimatedWordSwapProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (words.length <= 1) return;

    const timer = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 300); // Half of the animation duration
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval]);

  if (words.length === 0) return null;

  return (
    <span
      className={cn(
        'relative inline-block transition-all duration-500',
        isAnimating
          ? 'opacity-0 -translate-y-2 blur-sm'
          : 'opacity-100 translate-y-0 blur-0',
        className
      )}
    >
      {words[currentIndex]}
    </span>
  );
}
