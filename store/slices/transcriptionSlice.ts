import { StateCreator } from 'zustand';
import type {
  TranscriptionSegment,
  RecordingMetadata,
  TranscriptionSummary,
  RecordingStatus,
  WhisperModelStatus,
} from '@/features/transcription/types';

/**
 * Transcription state interface
 */
export interface TranscriptionState {
  // Recording state
  recordingStatus: RecordingStatus;
  isRecording: boolean;
  isPaused: boolean;
  audioLevel: number;
  recordingDuration: number; // seconds

  // Model state
  whisperModelStatus: WhisperModelStatus;
  whisperModelId: string | null;
  whisperModelProgress: number; // 0-100

  // Transcription data
  segments: TranscriptionSegment[];
  currentSegment: string; // Text being transcribed in real-time
  metadata: RecordingMetadata | null;

  // Summary state
  summary: TranscriptionSummary | null;
  isGeneratingSummary: boolean;

  // Error handling
  error: string | null;

  // Actions
  setRecordingStatus: (status: RecordingStatus) => void;
  setIsRecording: (isRecording: boolean) => void;
  setIsPaused: (isPaused: boolean) => void;
  setAudioLevel: (level: number) => void;
  setRecordingDuration: (duration: number) => void;

  setWhisperModelStatus: (status: WhisperModelStatus) => void;
  setWhisperModelId: (modelId: string | null) => void;
  setWhisperModelProgress: (progress: number) => void;

  addSegment: (segment: TranscriptionSegment) => void;
  updateCurrentSegment: (text: string) => void;
  setSegments: (segments: TranscriptionSegment[]) => void;
  setMetadata: (metadata: RecordingMetadata) => void;

  setSummary: (summary: TranscriptionSummary | null) => void;
  setIsGeneratingSummary: (isGenerating: boolean) => void;

  setError: (error: string | null) => void;
  clearTranscription: () => void;
  reset: () => void;
}

/**
 * Create transcription slice
 */
export const createTranscriptionSlice: StateCreator<TranscriptionState> = (set) => ({
  // Initial state
  recordingStatus: 'idle',
  isRecording: false,
  isPaused: false,
  audioLevel: 0,
  recordingDuration: 0,

  whisperModelStatus: 'idle',
  whisperModelId: null,
  whisperModelProgress: 0,

  segments: [],
  currentSegment: '',
  metadata: null,

  summary: null,
  isGeneratingSummary: false,

  error: null,

  // Recording actions
  setRecordingStatus: (status) => set({ recordingStatus: status }),
  
  setIsRecording: (isRecording) => set({ isRecording }),
  
  setIsPaused: (isPaused) => set({ isPaused }),
  
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  
  setRecordingDuration: (recordingDuration) => set({ recordingDuration }),

  // Model actions
  setWhisperModelStatus: (status) => set({ whisperModelStatus: status }),
  
  setWhisperModelId: (modelId) => set({ whisperModelId: modelId }),
  
  setWhisperModelProgress: (progress) => set({ whisperModelProgress: progress }),

  // Transcription actions
  addSegment: (segment) =>
    set((state) => ({
      segments: [...state.segments, segment],
      currentSegment: '', // Clear current segment after adding
    })),

  updateCurrentSegment: (text) => set({ currentSegment: text }),

  setSegments: (segments) => set({ segments }),

  setMetadata: (metadata) => set({ metadata }),

  // Summary actions
  setSummary: (summary) => set({ summary }),

  setIsGeneratingSummary: (isGenerating) => set({ isGeneratingSummary: isGenerating }),

  // Error handling
  setError: (error) => set({ error }),

  // Clear transcription data but keep model loaded
  clearTranscription: () =>
    set({
      segments: [],
      currentSegment: '',
      metadata: null,
      summary: null,
      recordingStatus: 'ready',
      isRecording: false,
      isPaused: false,
      audioLevel: 0,
      recordingDuration: 0,
      error: null,
    }),

  // Full reset including model
  reset: () =>
    set({
      recordingStatus: 'idle',
      isRecording: false,
      isPaused: false,
      audioLevel: 0,
      recordingDuration: 0,
      whisperModelStatus: 'idle',
      whisperModelId: null,
      whisperModelProgress: 0,
      segments: [],
      currentSegment: '',
      metadata: null,
      summary: null,
      isGeneratingSummary: false,
      error: null,
    }),
});

// Made with Bob