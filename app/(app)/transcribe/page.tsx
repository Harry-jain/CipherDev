'use client';

import { useEffect, useState, useRef } from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
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

      // Set up VAD callbacks
      audioCapture.onSpeechStart(() => {
        console.log('Speech started');
      });

      audioCapture.onSpeechEnd(() => {
        console.log('Speech ended');
      });

      // Set up data available callback for real-time transcription
      audioCapture.onDataAvailable(async (chunk) => {
        try {
          // Transcribe audio chunk
          const newSegments = await whisperEngine.transcribe(chunk.blob, {
            timestamp: chunk.timestamp,
            returnTimestamps: true,
          });

          // Add segments to state
          newSegments.forEach((segment) => {
            addSegment(segment);
          });
        } catch (err) {
          console.error('Transcription error:', err);
        }
      });

      // Start recording
      await audioCapture.startRecording();
      
      setIsRecording(true);
      setRecordingStatus('recording');
      
      // Set metadata
      setMetadata({
        startTime: Date.now(),
        endTime: null,
        duration: 0,
        language: 'en',
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

      // Stop recording and get final audio
      const audioBlob = await audioCapture.stopRecording();
      
      setIsRecording(false);
      setRecordingStatus('processing');

      // Transcribe final audio if any
      if (audioBlob.size > 0) {
        const finalSegments = await whisperEngine.transcribe(audioBlob, {
          timestamp: recordingDuration,
          returnTimestamps: true,
        });

        finalSegments.forEach((segment) => {
          addSegment(segment);
        });
      }

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

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Live Transcription</h1>
          <p className="text-gray-400 mt-1">
            Record and transcribe meetings with AI-powered summaries
          </p>
        </div>
        {whisperModelId && (
          <Badge variant="success">
            {whisperModelId.replace('whisper-', 'Whisper ')}
          </Badge>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-950/20 border-red-900/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-400">Error</h3>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Model Selection */}
      {whisperModelStatus === 'idle' && (
        <WhisperModelSelector
          deviceTier={deviceProfile?.tier || null}
          onLoadModel={handleLoadModel}
          disabled={false}
        />
      )}

      {/* Model Loading */}
      {whisperModelStatus === 'loading' && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-100">Loading Whisper Model</h3>
              <span className="text-sm text-gray-400">
                {whisperModelProgress.toFixed(0)}%
              </span>
            </div>
            <Progress value={whisperModelProgress} showLabel={false} />
            <p className="text-sm text-gray-500">
              Downloading model from HuggingFace...
            </p>
          </div>
        </Card>
      )}

      {/* Recording Controls */}
      {whisperModelStatus === 'loaded' && (
        <Card className="p-6">
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
        </Card>
      )}

      {/* Audio Visualizer */}
      {isRecording && (
        <AudioVisualizer
          audioLevel={audioLevel}
          isActive={isRecording && !isPaused}
        />
      )}

      {/* Live Transcription */}
      {segments.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Live Transcription
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {segments.map((segment) => (
              <TranscriptionSegment key={segment.id} segment={segment} />
            ))}
            {currentSegment && (
              <div className="p-4 bg-blue-950/20 border border-blue-900/50 rounded-lg">
                <p className="text-gray-300 italic">{currentSegment}...</p>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </Card>
      )}

      {/* Summary Section */}
      {recordingStatus === 'complete' && segments.length > 0 && (
        <div className="space-y-4">
          {!summary && !isGeneratingSummary && loadedModelId && (
            <Card className="p-6 text-center">
              <Button
                onClick={handleGenerateSummary}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Generate AI Summary
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Using {loadedModelId}
              </p>
            </Card>
          )}

          {!loadedModelId && (
            <Card className="p-6 text-center">
              <p className="text-gray-400">
                Load an LLM model from the Models page to generate summaries
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

      {/* Export Section */}
      {recordingStatus === 'complete' && exportData && (
        <ExportMenu data={exportData} />
      )}

      {/* New Recording Button */}
      {recordingStatus === 'complete' && (
        <Card className="p-6 text-center">
          <Button
            onClick={() => {
              clearTranscription();
              setRecordingStatus('ready');
            }}
            size="lg"
            variant="secondary"
          >
            Start New Recording
          </Button>
        </Card>
      )}
    </div>
  );
}

// Made with Bob