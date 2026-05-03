'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { AlertCircle, Sparkles, Mic, FileText, Clock, Languages } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getWhisperEngine } from '@/features/transcription/whisperEngine';
import { AudioCapture } from '@/features/transcription/audioCapture';
import { getCurrentEngine } from '@/features/llm/engineFactory';
import { AudioVisualizer } from '@/components/transcription/AudioVisualizer';
import { TranscriptionSegment } from '@/components/transcription/TranscriptionSegment';
import { SummaryCard } from '@/components/transcription/SummaryCard';
import { RecordingControls } from '@/components/transcription/RecordingControls';
import { ExportMenu } from '@/components/transcription/ExportMenu';
import { WhisperModelSelector } from '@/components/transcription/WhisperModelSelector';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { TranscriptionExport } from '@/features/transcription/types';
import {
  WHISPER_LANGUAGES,
  getWhisperLanguageByCode,
} from '@/features/transcription/whisperLanguages';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function TranscribePage() {
  const {
    // Transcription state
    recordingStatus,
    isRecording,
    isPaused,
    audioLevel,
    recordingDuration,
    whisperModelStatus,
    whisperModelId,
    whisperModelProgress,
    segments,
    currentSegment,
    metadata,
    summary,
    isGeneratingSummary,
    error,
    // Transcription actions
    setRecordingStatus,
    setIsRecording,
    setIsPaused,
    setAudioLevel,
    setRecordingDuration,
    setWhisperModelStatus,
    setWhisperModelId,
    setWhisperModelProgress,
    addSegment,
    updateCurrentSegment,
    setMetadata,
    setSummary,
    setIsGeneratingSummary,
    setError,
    clearTranscription,
    // Language
    language,
    setLanguage,
    // Hardware state
    deviceProfile,
    // LLM state
    loadedModelId,
  } = useAppStore();

  const [audioCapture] = useState(() => new AudioCapture());
  const whisperEngine = getWhisperEngine();
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom when new segments arrive
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [segments, currentSegment]);

  // Handle model loading
  const handleLoadModel = async (modelId: string) => {
    try {
      setError(null);
      setWhisperModelStatus('loading');
      setRecordingStatus('loading-model');

      await whisperEngine.loadModel(modelId, (progress) => {
        // Ensure progress stays within 0-100 range
        const normalizedProgress = Math.min(100, Math.max(0, progress.progress));
        setWhisperModelProgress(normalizedProgress);
      });

      setWhisperModelId(modelId);
      setWhisperModelStatus('loaded');
      setRecordingStatus('ready');
    } catch (err) {
      console.error('Failed to load Whisper model:', err);
      setError(err instanceof Error ? err.message : 'Failed to load model');
      setWhisperModelStatus('error');
      setRecordingStatus('error');
    }
  };

  // Handle start recording
  const handleStartRecording = async () => {
    try {
      setError(null);
      
      // Initialize audio capture
      await audioCapture.initialize();

      // Set up audio level monitoring
      audioCapture.onAudioLevel((level) => {
        setAudioLevel(level);
      });

      // Snapshot the language at recording start so changing the dropdown
      // mid-session doesn't fragment the transcript.
      const sessionLanguage =
        getWhisperLanguageByCode(language)?.whisperName ?? 'english';

      // VAD-driven: each detected utterance is delivered as raw 16kHz PCM and
      // fed straight to Whisper. WhisperEngine internally serializes calls.
      audioCapture.onSpeechAudio(async (audio, timestamp) => {
        try {
          const newSegments = await whisperEngine.transcribePCM(audio, {
            timestamp,
            returnTimestamps: true,
            language: sessionLanguage,
          });
          newSegments.forEach((segment) => addSegment(segment));
        } catch (err) {
          console.error('Transcription error:', err);
        }
      });

      // Start recording
      await audioCapture.startRecording();
      
      setIsRecording(true);
      setRecordingStatus('recording');
      
      setMetadata({
        startTime: Date.now(),
        endTime: null,
        duration: 0,
        language,
        whisperModel: whisperModelId || 'whisper-base',
      });

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        const status = audioCapture.getStatus();
        setRecordingDuration(status.duration);
      }, 100);

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setRecordingStatus('error');
    }
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    try {
      // Stop duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Stop VAD. There's no final blob — every utterance was already emitted
      // via onSpeechAudio. Drain in-flight transcriptions before reporting complete.
      await audioCapture.stopRecording();

      setIsRecording(false);
      setRecordingStatus('processing');

      await whisperEngine.waitForIdle();

      // Update metadata
      if (metadata) {
        setMetadata({
          ...metadata,
          endTime: Date.now(),
          duration: recordingDuration,
        });
      }

      setRecordingStatus('complete');
      
      // Cleanup audio capture
      await audioCapture.cleanup();

    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setRecordingStatus('error');
    }
  };

  // Handle pause recording
  const handlePauseRecording = () => {
    audioCapture.pauseRecording();
    setIsPaused(true);
  };

  // Handle resume recording
  const handleResumeRecording = () => {
    audioCapture.resumeRecording();
    setIsPaused(false);
  };

  // Handle generate summary
  const handleGenerateSummary = async () => {
    if (!loadedModelId) {
      setError('No LLM loaded. Please load a model from the Models page first.');
      return;
    }

    try {
      setIsGeneratingSummary(true);
      setError(null);

      // Get current engine
      const engine = getCurrentEngine();

      if (!engine) {
        throw new Error('LLM engine not available');
      }

      // Prepare transcript text
      const transcriptText = segments.map(s => s.text).join(' ');

      // Create summary prompt
      const summaryPrompt = `Please provide a concise summary of the following meeting transcription. Include 3-5 key points as a bulleted list.

Transcription:
${transcriptText}

Provide your response in the following format:
Summary: [Your summary here]

Key Points:
- [Point 1]
- [Point 2]
- [Point 3]`;

      // Generate summary
      let summaryText = '';
      await engine.generate(
        [{ role: 'user', content: summaryPrompt }],
        (chunk) => {
          summaryText += chunk;
        }
      );

      // Parse summary and key points
      const summaryMatch = summaryText.match(/Summary:\s*(.+?)(?=Key Points:|$)/s);
      const keyPointsMatch = summaryText.match(/Key Points:\s*(.+)/s);

      const parsedSummary = summaryMatch ? summaryMatch[1].trim() : summaryText;
      const keyPoints = keyPointsMatch
        ? keyPointsMatch[1]
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim())
        : [];

      setSummary({
        text: parsedSummary,
        keyPoints,
        model: loadedModelId,
        generatedAt: Date.now(),
      });

    } catch (err) {
      console.error('Failed to generate summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Prepare export data
  const exportData: TranscriptionExport | null = metadata
    ? {
        metadata,
        summary,
        segments,
      }
    : null;

  const wordCount = useMemo(
    () => segments.reduce((n, s) => n + s.text.trim().split(/\s+/).filter(Boolean).length, 0),
    [segments],
  );

  const showSessionPanel = whisperModelStatus === 'loaded';
  const isLive = isRecording && !isPaused;

  return (
    <div className="mx-auto px-6 py-8 max-w-4xl space-y-6">
      {/* Header */}
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-100 tracking-tight">
            Live Transcription
          </h1>
          <p className="text-sm text-gray-400">
            Record meetings, transcribe locally, and summarize with your loaded LLM.
          </p>
        </div>
        {whisperModelId && (
          <Badge variant="success" className="flex-shrink-0">
            {whisperModelId.replace('whisper-', 'Whisper ')}
          </Badge>
        )}
      </header>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-950/30 border border-red-900/50">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-300">Something went wrong</p>
            <p className="text-sm text-red-400/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Model selection */}
      {whisperModelStatus === 'idle' && (
        <WhisperModelSelector
          deviceTier={deviceProfile?.tier || null}
          onLoadModel={handleLoadModel}
          disabled={false}
        />
      )}

      {/* Model loading */}
      {whisperModelStatus === 'loading' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              <h3 className="font-medium text-gray-100">Loading Whisper model</h3>
            </div>
            <span className="text-sm text-gray-400 tabular-nums">
              {whisperModelProgress.toFixed(0)}%
            </span>
          </div>
          <Progress value={whisperModelProgress} showLabel={false} />
          <p className="text-xs text-gray-500">
            Downloading model weights from HuggingFace…
          </p>
        </Card>
      )}

      {/* Session panel: language + controls + meter in one card */}
      {showSessionPanel && (
        <Card
          className={cn(
            'p-6 space-y-5 transition-all',
            isLive && 'ring-1 ring-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.08)]',
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="transcription-language"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              <Languages className="h-3.5 w-3.5" />
              Language
            </label>
            <select
              id="transcription-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isRecording}
              className={cn(
                'min-w-[14rem] px-3 py-1.5 rounded-md text-sm',
                'bg-gray-800 border border-gray-700 text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
              title={
                isRecording
                  ? 'Stop the current recording to change language'
                  : undefined
              }
            >
              {WHISPER_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <RecordingControls
            status={recordingStatus}
            isRecording={isRecording}
            isPaused={isPaused}
            duration={recordingDuration}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
            onPause={handlePauseRecording}
            onResume={handleResumeRecording}
            disabled={whisperModelStatus !== 'loaded'}
          />
          <AudioVisualizer audioLevel={audioLevel} isActive={isLive} />
        </Card>
      )}

      {/* Transcript */}
      {(isRecording || segments.length > 0) && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Transcript
            </h2>
            {segments.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {segments.length} {segments.length === 1 ? 'segment' : 'segments'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
              </div>
            )}
          </div>

          <div className="max-h-[28rem] overflow-y-auto custom-scrollbar -mx-2 px-2">
            {segments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center',
                    isLive
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-gray-800/60 text-gray-500',
                  )}
                >
                  <Mic className={cn('h-5 w-5', isLive && 'animate-pulse')} />
                </div>
                <p className="text-sm text-gray-400">
                  {isLive
                    ? 'Listening… speak to see your transcript appear here.'
                    : isPaused
                    ? 'Paused. Resume to continue capturing speech.'
                    : 'No speech captured yet.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/40">
                {segments.map((segment) => (
                  <TranscriptionSegment key={segment.id} segment={segment} />
                ))}
                {currentSegment && (
                  <p className="px-4 py-3 -mx-4 text-gray-400 italic">
                    {currentSegment}…
                  </p>
                )}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Post-recording actions */}
      {recordingStatus === 'complete' && segments.length > 0 && (
        <div className="space-y-4">
          {!summary && !isGeneratingSummary && loadedModelId && (
            <Card className="p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-gray-100">Generate AI summary</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Using {loadedModelId} — runs locally on your device.
                </p>
              </div>
              <Button onClick={handleGenerateSummary} className="gap-2 flex-shrink-0">
                <Sparkles className="h-4 w-4" />
                Generate
              </Button>
            </Card>
          )}

          {!loadedModelId && (
            <Card className="p-5">
              <p className="text-sm text-gray-400">
                Load an LLM from the <span className="text-gray-200">Models</span> page to
                generate a summary of this transcript.
              </p>
            </Card>
          )}

          {summary && (
            <SummaryCard
              summary={summary}
              isGenerating={isGeneratingSummary}
              onRegenerate={handleGenerateSummary}
            />
          )}
        </div>
      )}

      {recordingStatus === 'complete' && exportData && (
        <ExportMenu data={exportData} />
      )}

      {recordingStatus === 'complete' && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={() => {
              clearTranscription();
              setRecordingStatus('ready');
            }}
            variant="ghost"
            className="gap-2"
          >
            <Mic className="h-4 w-4" />
            Start a new recording
          </Button>
        </div>
      )}
    </div>
  );
}

// Made with Bob