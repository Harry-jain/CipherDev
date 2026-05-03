'use client';

import { Mic, Square, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TranscriptionProcessor } from '@/features/transcription/transcriptionProcessor';
import { cn } from '@/lib/utils';
import type { RecordingStatus } from '@/features/transcription/types';

interface RecordingControlsProps {
  status: RecordingStatus;
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // seconds
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Recording control buttons with timer
 * Handles start, stop, pause, and resume actions
 */
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

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready to record';
      case 'loading-model':
        return 'Loading model...';
      case 'ready':
        return 'Ready to record';
      case 'recording':
        return isPaused ? 'Paused' : 'Recording';
      case 'processing':
        return 'Processing...';
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const statusColor = () => {
    if (status === 'error') return 'text-red-400';
    if (isRecording && !isPaused) return 'text-red-400 animate-pulse';
    if (isPaused) return 'text-yellow-400';
    if (status === 'complete') return 'text-green-400';
    return 'text-gray-400';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status and Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-3 h-3 rounded-full', statusColor().replace('text-', 'bg-'))} />
          <span className={cn('text-sm font-medium', statusColor())}>
            {getStatusText()}
          </span>
        </div>
        
        {isRecording && (
          <div className="text-2xl font-mono font-bold text-gray-100">
            {formattedDuration}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        {!isRecording ? (
          // Start Recording Button
          <Button
            onClick={onStart}
            disabled={disabled || status === 'loading-model'}
            size="lg"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <Mic className="h-5 w-5 mr-2" />
            Start Recording
          </Button>
        ) : (
          <>
            {/* Pause/Resume Button */}
            <Button
              onClick={isPaused ? onResume : onPause}
              disabled={disabled}
              size="lg"
              variant="secondary"
              className="flex-1"
            >
              {isPaused ? (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              )}
            </Button>

            {/* Stop Button */}
            <Button
              onClick={onStop}
              disabled={disabled}
              size="lg"
              variant="danger"
              className="flex-1"
            >
              <Square className="h-5 w-5 mr-2" />
              Stop Recording
            </Button>
          </>
        )}
      </div>

      {/* Helper text */}
      {!isRecording && status === 'ready' && (
        <p className="text-xs text-gray-500 text-center">
          Click "Start Recording" to begin transcribing your meeting
        </p>
      )}
    </div>
  );
}

// Made with Bob