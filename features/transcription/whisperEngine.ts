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

      // Map our model IDs to HuggingFace model IDs
      // Using multilingual models (no .en suffix) for broader language support
      const modelMap: Record<string, string> = {
        'whisper-large-v3-turbo': 'Xenova/whisper-small', // Fallback to small (multilingual)
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
   * Transcribe audio blob to text
   */
  async transcribe(
    audioBlob: Blob,
    options?: {
      language?: string;
      timestamp?: number;
      returnTimestamps?: boolean;
    }
  ): Promise<TranscriptionSegment[]> {
    if (!this.pipeline) {
      throw new Error('Whisper model not loaded. Call loadModel() first.');
    }

    if (this.isProcessing) {
      throw new Error('Already processing audio. Please wait.');
    }

    this.isProcessing = true;

    try {
      // Convert Blob to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Create audio context to decode audio
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get audio data as Float32Array (mono channel)
      const audioData = audioBuffer.getChannelData(0);

      // Transcribe with Whisper
      const result = await this.pipeline(audioData, {
        language: options?.language || 'english',
        task: 'transcribe',
        return_timestamps: options?.returnTimestamps ?? true,
        chunk_length_s: 30, // Process in 30-second chunks
        stride_length_s: 5, // 5-second overlap between chunks
      });

      // Parse result into segments
      const segments: TranscriptionSegment[] = [];

      if (result.chunks && Array.isArray(result.chunks)) {
        // Result has timestamp chunks
        for (let i = 0; i < result.chunks.length; i++) {
          const chunk = result.chunks[i];
          segments.push({
            id: `seg_${Date.now()}_${i}`,
            timestamp: (options?.timestamp || 0) + (chunk.timestamp?.[0] || 0),
            text: chunk.text.trim(),
            confidence: 0.9, // Transformers.js doesn't provide confidence scores
          });
        }
      } else if (result.text) {
        // Single text result without timestamps
        segments.push({
          id: `seg_${Date.now()}_0`,
          timestamp: options?.timestamp || 0,
          text: result.text.trim(),
          confidence: 0.9,
        });
      }

      console.log(`Transcribed ${segments.length} segments`);
      return segments;
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error(
        `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      this.isProcessing = false;
    }
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