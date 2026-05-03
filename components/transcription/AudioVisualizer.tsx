'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  /** Microphone level, 0-1 */
  audioLevel: number;
  /** Whether the meter should react to input. When false, the bar drains. */
  isActive: boolean;
  className?: string;
}

/**
 * Single horizontal level meter. Width is driven by the smoothed mic level
 * with a fast attack / slow decay so the bar feels responsive but doesn't
 * jitter on every animation frame.
 */
export function AudioVisualizer({ audioLevel, isActive, className }: AudioVisualizerProps) {
  const [displayLevel, setDisplayLevel] = useState(0);
  const rafRef = useRef<number>();
  const targetRef = useRef(0);
  const currentRef = useRef(0);

  useEffect(() => {
    targetRef.current = isActive ? Math.max(0, Math.min(1, audioLevel)) : 0;
  }, [audioLevel, isActive]);

  useEffect(() => {
    const tick = () => {
      const target = targetRef.current;
      const current = currentRef.current;
      // Snappy on the way up, easier on the way down.
      const factor = target > current ? 0.45 : 0.12;
      const next = current + (target - current) * factor;
      currentRef.current = next < 0.001 ? 0 : next;
      setDisplayLevel(currentRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const widthPct = displayLevel * 100;
  const showFill = displayLevel > 0.005;

  return (
    <div
      className={cn(
        'relative w-full h-2 rounded-full bg-gray-800/70 overflow-hidden',
        className,
      )}
      role="meter"
      aria-label="Microphone level"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={Number(displayLevel.toFixed(3))}
    >
      {showFill && (
        <div
          className="h-full rounded-full"
          style={{
            width: `${widthPct}%`,
            background: 'linear-gradient(90deg, #22d3ee 0%, #67e8f9 100%)',
            boxShadow:
              '0 0 14px rgba(103, 232, 249, 0.55), 0 0 4px rgba(103, 232, 249, 0.9)',
            transition: 'width 80ms linear',
          }}
        />
      )}
    </div>
  );
}
