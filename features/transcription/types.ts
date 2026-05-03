// ============================================================================
// TRANSCRIPTION TYPES
// ============================================================================

/**
 * Individual transcription segment with timestamp
 */
export interface TranscriptionSegment {
  id: string;
  timestamp: number; // seconds from recording start
  text: string;
  confidence?: number; // 0-1 from Whisper model
}

/**
 * Recording metadata
 */
export interface RecordingMetadata {
  startTime: number; // Unix timestamp
  endTime: number | null; // Unix timestamp or null if recording
  duration: number; // seconds
  language: string; // ISO language code (e.g., 'en')
  whisperModel: string; // Model ID used for transcription
}

/**
 * AI-generated summary data
 */
export interface TranscriptionSummary {
  text: string; // Full summary text
  keyPoints: string[]; // Extracted key points
  model: string; // LLM model used for summary
  generatedAt: number; // Unix timestamp
}

/**
 * Complete transcription export data
 */
export interface TranscriptionExport {
  metadata: RecordingMetadata;
  summary: TranscriptionSummary | null;
  segments: TranscriptionSegment[];
}

/**
 * Recording status states
 */
export type RecordingStatus =
  | 'idle' // Not recording, no data
  | 'loading-model' // Loading Whisper model
  | 'ready' // Model loaded, ready to record
  | 'recording' // Currently recording
  | 'paused' // Recording paused
  | 'processing' // Processing final transcription
  | 'complete' // Recording complete with transcription
  | 'error'; // Error occurred

/**
 * Whisper model loading status
 */
export type WhisperModelStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Audio chunk for processing
 */
export interface AudioChunk {
  blob: Blob;
  timestamp: number; // seconds from recording start
  duration: number; // seconds
}

/**
 * VAD (Voice Activity Detection) event
 */
export interface VADEvent {
  type: 'speech-start' | 'speech-end';
  timestamp: number;
  audioLevel: number; // 0-1
}

/**
 * Whisper model specification
 */
export interface WhisperModelSpec {
  id: string;
  name: string;
  huggingfaceId: string;
  size: number; // MB
  tiers: string[]; // Compatible device tiers
  description: string;
  language?: string; // Primary language or 'multilingual'
}

/**
 * Transcription progress callback
 */
export interface TranscriptionProgress {
  status: string;
  progress: number; // 0-100
  currentSegment?: number;
  totalSegments?: number;
}

/**
 * Export format options
 */
export type ExportFormat = 'markdown' | 'json';

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeSummary: boolean;
  includeTimestamps: boolean;
}

// Made with Bob