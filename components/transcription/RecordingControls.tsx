'use client';

import { Mic, Square, Pause, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TranscriptionProcessor } from '@/features/transcription/transcriptionProcessor';
import { cn } from '@/lib/utils';
import type { RecordingStatus } from '@/features/transcription/types';

interface RecordingControlsProps {
  status: RecordingStatus;
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  disabled?: boolean;
  className?: string;
}

export function RecordingControls({
  status,
  isRecording,
  isPaused,
  duration,
  onStart,
  onStop,
  onPause,
  onResume,
  disabled = false,
  className,
}: RecordingControlsProps) {
  const formattedDuration = TranscriptionProcessor.formatTimestamp(duration);

  const statusLabel = (() => {
    if (status === 'loading-model') return 'Loading model';
    if (status === 'processing') return 'Processing';
    if (status === 'error') return 'Error';
    if (isRecording) return isPaused ? 'Paused' : 'Recording';
    if (status === 'complete') return 'Complete';
    return 'Ready';
  })();

  const dotClass = (() => {
    if (status === 'error') return 'bg-red-500';
    if (isRecording && !isPaused) return 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.7)]';
    if (isPaused) return 'bg-yellow-400';
    if (status === 'complete') return 'bg-green-500';
    if (status === 'loading-model' || status === 'processing') return 'bg-blue-400 animate-pulse';
    return 'bg-gray-500';
  })();

  return (
    <div className={cn('flex items-center justify-between gap-6', className)}>
      {/* Left: status + timer */}
      <div className="flex items-center gap-4 min-w-0">
        <div className={cn('h-3 w-3 rounded-full flex-shrink-0', dotClass)} />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
            {statusLabel}
          </p>
          <p className="text-3xl font-mono font-semibold text-gray-100 tabular-nums leading-tight">
            {formattedDuration}
          </p>
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isRecording ? (
          <Button
            onClick={onStart}
            disabled={disabled || status === 'loading-model'}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white gap-2 px-6"
          >
            {status === 'loading-model' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
            Start Recording
          </Button>
        ) : (
          <>
            <Button
              onClick={isPaused ? onResume : onPause}
              disabled={disabled}
              size="md"
              variant="secondary"
              className="gap-2"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
            </Button>
            <Button
              onClick={onStop}
              disabled={disabled}
              size="md"
              variant="danger"
              className="gap-2"
            >
              <Square className="h-4 w-4 fill-current" />
              Stop
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
