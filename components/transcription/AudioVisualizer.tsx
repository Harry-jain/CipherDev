'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  audioLevel: number; // 0-1
  isActive: boolean;
  className?: string;
}

/**
 * Audio visualizer component with animated bars
 * Shows real-time audio level during recording
 */
export function AudioVisualizer({ audioLevel, isActive, className }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barCount = 32;
    const barWidth = canvas.width / barCount;
    const maxBarHeight = canvas.height;

    // Generate random heights for bars (simulating frequency bands)
    const barHeights = Array.from({ length: barCount }, () => Math.random());

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isActive) {
        // Show flat line when inactive
        ctx.fillStyle = '#374151'; // gray-700
        for (let i = 0; i < barCount; i++) {
          const x = i * barWidth;
          const height = 4;
          const y = maxBarHeight - height;
          ctx.fillRect(x, y, barWidth - 2, height);
        }
        return;
      }

      // Update bar heights with smooth animation
      for (let i = 0; i < barCount; i++) {
        // Add some randomness for natural movement
        const targetHeight = audioLevel * (0.5 + Math.random() * 0.5);
        barHeights[i] += (targetHeight - barHeights[i]) * 0.3;

        const x = i * barWidth;
        const height = Math.max(4, barHeights[i] * maxBarHeight);
        const y = maxBarHeight - height;

        // Color based on audio level
        let color;
        if (audioLevel > 0.7) {
          color = '#ef4444'; // red-500 (loud)
        } else if (audioLevel > 0.4) {
          color = '#eab308'; // yellow-500 (medium)
        } else {
          color = '#22c55e'; // green-500 (quiet)
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth - 2, height);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioLevel, isActive]);

  return (
    <div className={cn('relative', className)}>
      <canvas
        ref={canvasRef}
        width={800}
        height={100}
        className="w-full h-24 rounded-lg bg-gray-900/50 border border-gray-800/50"
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-gray-500">Audio visualizer inactive</p>
        </div>
      )}
    </div>
  );
}

// Made with Bob