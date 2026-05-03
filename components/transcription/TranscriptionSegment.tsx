'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { TranscriptionSegment as TranscriptionSegmentType } from '@/features/transcription/types';
import { TranscriptionProcessor } from '@/features/transcription/transcriptionProcessor';
import { cn } from '@/lib/utils';

interface TranscriptionSegmentProps {
  segment: TranscriptionSegmentType;
  className?: string;
}

export function TranscriptionSegment({ segment, className }: TranscriptionSegmentProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(segment.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const timestamp = TranscriptionProcessor.formatTimestamp(segment.timestamp);

  return (
    <div
      className={cn(
        'group flex items-start gap-4 px-4 py-3 -mx-4 rounded-md',
        'hover:bg-gray-800/40 transition-colors',
        className,
      )}
    >
      <span className="flex-shrink-0 mt-1 text-xs font-mono text-blue-400/80 tabular-nums">
        {timestamp}
      </span>

      <p className="flex-1 min-w-0 text-gray-200 leading-relaxed">
        {segment.text}
      </p>

      <button
        onClick={handleCopy}
        className={cn(
          'flex-shrink-0 p-1.5 rounded opacity-0 group-hover:opacity-100',
          'transition-all',
          copied
            ? 'text-green-400 opacity-100'
            : 'text-gray-500 hover:text-gray-200 hover:bg-gray-700/50',
        )}
        title={copied ? 'Copied' : 'Copy text'}
        aria-label={copied ? 'Copied' : 'Copy text'}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
