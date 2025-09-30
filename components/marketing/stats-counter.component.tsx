'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/design-system';

/**
 * Props for the StatsCounter component
 */
type StatsCounterProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  label: string;
};

/**
 * Animated counter component that counts up from 0 to target value.
 * Inspired by Notion's metric displays.
 */
export function StatsCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
  className,
  valueClassName,
  labelClassName,
  label,
}: StatsCounterProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const increment = value / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isVisible, value, duration]);

  return (
    <div ref={counterRef} className={cn('text-center lg:text-left', className)}>
      <div className={cn('text-2xl font-bold text-primary', valueClassName)}>
        {prefix}
        {count}
        {suffix}
      </div>
      <div className={cn('text-sm text-muted-foreground', labelClassName)}>
        {label}
      </div>
    </div>
  );
}
