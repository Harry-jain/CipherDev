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

/**
 * Individual transcription segment with timestamp
 * Displays a single segment of transcribed text
 */
export function TranscriptionSegment({ segment, className }: TranscriptionSegmentProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(segment.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const timestamp = TranscriptionProcessor.formatTimestamp(segment.timestamp);
  const confidenceColor = segment.confidence
    ? segment.confidence > 0.9
      ? 'text-green-500'
      : segment.confidence > 0.7
      ? 'text-yellow-500'
      : 'text-orange-500'
    : 'text-gray-500';

  return (
    <div
      className={cn(
        'group relative p-4 rounded-lg',
        'bg-gray-900/30 border border-gray-800/50',
        'hover:bg-gray-900/50 hover:border-gray-700/50',
        'transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Timestamp */}
        <div className="flex-shrink-0">
          <span className="text-xs font-mono text-blue-400 bg-blue-950/50 px-2 py-1 rounded">
            {timestamp}
          </span>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-200 leading-relaxed">{segment.text}</p>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className={cn(
              'p-2 rounded-lg transition-colors',
              copied
                ? 'bg-green-600/20 text-green-400'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
            )}
            title="Copy text"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Confidence indicator */}
      {segment.confidence !== undefined && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', confidenceColor.replace('text-', 'bg-'))}
              style={{ width: `${segment.confidence * 100}%` }}
            />
          </div>
          <span className={cn('text-xs font-medium', confidenceColor)}>
            {Math.round(segment.confidence * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Made with Bob