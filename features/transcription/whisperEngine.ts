import type { Pipeline } from '@xenova/transformers';
import type { TranscriptionSegment, WhisperModelSpec, TranscriptionProgress } from './types';

/**
 * Whisper Engine for speech-to-text transcription
 * Uses @xenova/transformers for browser-based inference
 */
export class WhisperEngine {
  private pipeline: Pipeline | null = null;
  private loadedModelId: string | null = null;
  private isProcessing: boolean = false;
  // Serial queue so concurrent transcribe calls run one-at-a-time instead of throwing.
  private queue: Promise<unknown> = Promise.resolve();

  /**
   * Load Whisper model
   */
  async loadModel(
    modelId: string,
    onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<void> {
    if (this.pipeline && this.loadedModelId === modelId) {
      console.log('Model already loaded:', modelId);
      return;
    }

    try {
      // Dynamic import to prevent SSR issues
      const { pipeline } = await import('@xenova/transformers');

      onProgress?.({
        status: 'Initializing Whisper engine...',
        progress: 0,
      });

      // Map our model IDs to HuggingFace model IDs.
      // Multilingual models (no .en suffix) for broader language support.
      const modelMap: Record<string, string> = {
        'whisper-base': 'Xenova/whisper-base',
        'whisper-small': 'Xenova/whisper-small',
        'whisper-tiny': 'Xenova/whisper-tiny',
      };

      const huggingfaceId = modelMap[modelId] || 'Xenova/whisper-tiny';

      onProgress?.({
        status: 'Downloading model weights...',
        progress: 30,
      });

      // Load the automatic-speech-recognition pipeline
      this.pipeline = await pipeline('automatic-speech-recognition', huggingfaceId, {
        progress_callback: (progress: any) => {
          if (progress.status === 'progress' && progress.progress) {
            const percent = Math.round(progress.progress * 100);
            // Calculate progress: 30% for init + 60% for download = 90% max
            const calculatedProgress = 30 + (percent * 0.6);
            // Ensure progress stays within 0-100 range
            const normalizedProgress = Math.min(100, Math.max(0, calculatedProgress));
            onProgress?.({
              status: `Downloading: ${percent}%`,
              progress: normalizedProgress,
            });
          } else if (progress.status === 'done') {
            onProgress?.({
              status: 'Processing model...',
              progress: 95,
            });
          }
        },
      });

      this.loadedModelId = modelId;

      onProgress?.({
        status: 'Model loaded successfully',
        progress: 100,
      });

      console.log('Whisper model loaded:', modelId);
    } catch (error) {
      console.error('Failed to load Whisper model:', error);
      throw new Error(
        `Failed to load Whisper model: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Transcribe a Blob (e.g. full recording on stop) by decoding to PCM first.
   */
  async transcribe(
    audioBlob: Blob,
    options?: {
      language?: string;
      timestamp?: number;
      returnTimestamps?: boolean;
    }
  ): Promise<TranscriptionSegment[]> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const audioData = audioBuffer.getChannelData(0);
    return this.transcribePCM(audioData, options);
  }

  /**
   * Transcribe raw 16kHz mono PCM (Float32Array, samples in [-1, 1]).
   * This is the path used by the VAD-driven live capture — it skips Blob decoding
   * which only worked for the first MediaRecorder chunk anyway.
   *
   * Calls are serialized through an internal queue, so callers can fire-and-forget
   * speech segments without worrying about overlap.
   */
  transcribePCM(
    audio: Float32Array,
    options?: {
      language?: string;
      timestamp?: number;
      returnTimestamps?: boolean;
    }
  ): Promise<TranscriptionSegment[]> {
    const run = async (): Promise<TranscriptionSegment[]> => {
      if (!this.pipeline) {
        throw new Error('Whisper model not loaded. Call loadModel() first.');
      }

      this.isProcessing = true;
      try {
        // VAD utterances are typically 1–10s and fit in Whisper's 30s receptive
        // field — chunking with stride here just doubles the work. If a caller
        // needs to transcribe long audio (>30s), they can pass chunk_length_s
        // through options in the future.
        //
        // Language is intentionally omitted when the caller doesn't specify
        // one, so Whisper auto-detects from the audio. The multilingual Xenova
        // ports support ~99 languages; pinning it to English here would
        // produce broken output for non-English speakers.
        const pipelineOptions: Record<string, unknown> = {
          task: 'transcribe',
          return_timestamps: options?.returnTimestamps ?? true,
        };
        if (options?.language) {
          pipelineOptions.language = options.language;
        }
        const result = await this.pipeline(audio, pipelineOptions);

        const baseTs = options?.timestamp || 0;
        const segments: TranscriptionSegment[] = [];

        if (result.chunks && Array.isArray(result.chunks)) {
          for (let i = 0; i < result.chunks.length; i++) {
            const chunk = result.chunks[i];
            const text = (chunk.text || '').trim();
            if (!text) continue;
            segments.push({
              id: `seg_${Date.now()}_${i}`,
              timestamp: baseTs + (chunk.timestamp?.[0] || 0),
              text,
              confidence: 0.9,
            });
          }
        } else if (result.text) {
          const text = result.text.trim();
          if (text) {
            segments.push({
              id: `seg_${Date.now()}_0`,
              timestamp: baseTs,
              text,
              confidence: 0.9,
            });
          }
        }

        return segments;
      } finally {
        this.isProcessing = false;
      }
    };

    // Chain onto the queue; swallow upstream errors so one bad segment doesn't
    // poison subsequent ones, but still surface this call's own error.
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }

  /**
   * Transcribe audio with streaming (for real-time display)
   */
  async transcribeStreaming(
    audioBlob: Blob,
    onSegment: (segment: TranscriptionSegment) => void,
    options?: {
      language?: string;
      timestamp?: number;
    }
  ): Promise<void> {
    const segments = await this.transcribe(audioBlob, {
      ...options,
      returnTimestamps: true,
    });

    // Emit segments one by one with small delay for streaming effect
    for (const segment of segments) {
      onSegment(segment);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Resolves once every queued transcribePCM call has finished. Used by the
   * recording UI to defer "complete" status until VAD-emitted utterances
   * have all been processed.
   */
  async waitForIdle(): Promise<void> {
    await this.queue.catch(() => undefined);
  }

  /**
   * Check if model is loaded
   */
  isLoaded(): boolean {
    return this.pipeline !== null;
  }

  /**
   * Get loaded model ID
   */
  getLoadedModelId(): string | null {
    return this.loadedModelId;
  }

  /**
   * Check if currently processing
   */
  isProcessingAudio(): boolean {
    return this.isProcessing;
  }

  /**
   * Unload model and free memory
   */
  async unload(): Promise<void> {
    if (this.pipeline) {
      // Transformers.js doesn't have explicit unload, but we can clear the reference
      this.pipeline = null;
      this.loadedModelId = null;
      console.log('Whisper model unloaded');
    }
  }
}

// Singleton instance
let whisperEngineInstance: WhisperEngine | null = null;

/**
 * Get singleton Whisper engine instance
 */
export function getWhisperEngine(): WhisperEngine {
  if (!whisperEngineInstance) {
    whisperEngineInstance = new WhisperEngine();
  }
  return whisperEngineInstance;
}

// Made with Bob