import type { MicVAD } from '@ricky0123/vad-web';
import type { AudioChunk, VADEvent } from './types';

/**
 * Audio capture with Voice Activity Detection (VAD)
 * Handles microphone access, recording, and speech detection
 */
export class AudioCapture {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private vad: MicVAD | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private isPaused: boolean = false;
  private recordingStartTime: number = 0;
  private pausedDuration: number = 0;
  private lastPauseTime: number = 0;
  
  // Callbacks
  private onSpeechStartCallback?: (event: VADEvent) => void;
  private onSpeechEndCallback?: (event: VADEvent) => void;
  private onAudioLevelCallback?: (level: number) => void;
  private onDataAvailableCallback?: (chunk: AudioChunk) => void;

  /**
   * Initialize audio capture and VAD
   */
  async initialize(): Promise<void> {
    try {
      // Request microphone permission
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('Microphone access granted');

      // Initialize VAD
      await this.initializeVAD();

      console.log('Audio capture initialized');
    } catch (error) {
      console.error('Failed to initialize audio capture:', error);
      throw new Error(
        `Failed to access microphone: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Initialize Voice Activity Detection
   */
  private async initializeVAD(): Promise<void> {
    try {
      const { MicVAD } = await import('@ricky0123/vad-web');

      this.vad = await MicVAD.new({
        onSpeechStart: () => {
          const event: VADEvent = {
            type: 'speech-start',
            timestamp: this.getCurrentTimestamp(),
            audioLevel: 0.8,
          };
          this.onSpeechStartCallback?.(event);
          console.log('Speech detected');
        },
        onSpeechEnd: () => {
          const event: VADEvent = {
            type: 'speech-end',
            timestamp: this.getCurrentTimestamp(),
            audioLevel: 0.2,
          };
          this.onSpeechEndCallback?.(event);
          console.log('Speech ended');
        },
        onVADMisfire: () => {
          console.log('VAD misfire (false positive)');
        },
        positiveSpeechThreshold: 0.8,
        negativeSpeechThreshold: 0.5,
        minSpeechFrames: 3,
        redemptionFrames: 8,
      } as any); // Type assertion for compatibility

      console.log('VAD initialized');
    } catch (error) {
      console.error('Failed to initialize VAD:', error);
      // VAD is optional, continue without it
      console.warn('Continuing without VAD');
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    if (!this.audioStream) {
      throw new Error('Audio capture not initialized. Call initialize() first.');
    }

    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    try {
      // Create MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      // Reset state
      this.audioChunks = [];
      this.recordingStartTime = Date.now();
      this.pausedDuration = 0;
      this.isRecording = true;
      this.isPaused = false;

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          
          // Emit chunk for real-time processing
          if (this.onDataAvailableCallback) {
            const chunk: AudioChunk = {
              blob: event.data,
              timestamp: this.getCurrentTimestamp(),
              duration: event.data.size / (128000 / 8), // Approximate duration
            };
            this.onDataAvailableCallback(chunk);
          }
        }
      };

      // Start recording with timeslice for real-time chunks
      this.mediaRecorder.start(5000); // 5-second chunks

      // Start VAD if available
      if (this.vad) {
        this.vad.start();
      }

      // Start audio level monitoring
      this.startAudioLevelMonitoring();

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error(
        `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording(): Promise<Blob> {
    if (!this.mediaRecorder || !this.isRecording) {
      throw new Error('Not currently recording');
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not available'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const mimeType = this.getSupportedMimeType();
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          
          this.isRecording = false;
          this.isPaused = false;
          
          // Stop VAD
          if (this.vad) {
            this.vad.pause();
          }

          console.log('Recording stopped, blob size:', audioBlob.size);
          resolve(audioBlob);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (!this.mediaRecorder || !this.isRecording || this.isPaused) {
      return;
    }

    this.mediaRecorder.pause();
    this.isPaused = true;
    this.lastPauseTime = Date.now();

    if (this.vad) {
      this.vad.pause();
    }

    console.log('Recording paused');
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (!this.mediaRecorder || !this.isRecording || !this.isPaused) {
      return;
    }

    this.mediaRecorder.resume();
    this.pausedDuration += Date.now() - this.lastPauseTime;
    this.isPaused = false;

    if (this.vad) {
      this.vad.start();
    }

    console.log('Recording resumed');
  }

  /**
   * Get current timestamp relative to recording start
   */
  private getCurrentTimestamp(): number {
    if (!this.isRecording) return 0;
    const elapsed = Date.now() - this.recordingStartTime - this.pausedDuration;
    return elapsed / 1000; // Convert to seconds
  }

  /**
   * Start monitoring audio levels
   */
  private startAudioLevelMonitoring(): void {
    if (!this.audioStream) return;

    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(this.audioStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!this.isRecording || this.isPaused) return;

        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const level = average / 255; // Normalize to 0-1

        this.onAudioLevelCallback?.(level);

        requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (error) {
      console.error('Failed to start audio level monitoring:', error);
    }
  }

  /**
   * Get supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Register callback for speech start events
   */
  onSpeechStart(callback: (event: VADEvent) => void): void {
    this.onSpeechStartCallback = callback;
  }

  /**
   * Register callback for speech end events
   */
  onSpeechEnd(callback: (event: VADEvent) => void): void {
    this.onSpeechEndCallback = callback;
  }

  /**
   * Register callback for audio level updates
   */
  onAudioLevel(callback: (level: number) => void): void {
    this.onAudioLevelCallback = callback;
  }

  /**
   * Register callback for data available events
   */
  onDataAvailable(callback: (chunk: AudioChunk) => void): void {
    this.onDataAvailableCallback = callback;
  }

  /**
   * Get recording status
   */
  getStatus(): {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
  } {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      duration: this.getCurrentTimestamp(),
    };
  }

  /**
   * Cleanup and release resources
   */
  async cleanup(): Promise<void> {
    // Stop recording if active
    if (this.isRecording && this.mediaRecorder) {
      try {
        await this.stopRecording();
      } catch (error) {
        console.error('Error stopping recording during cleanup:', error);
      }
    }

    // Stop VAD
    if (this.vad) {
      this.vad.destroy();
      this.vad = null;
    }

    // Stop audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    // Clear state
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.isPaused = false;

    console.log('Audio capture cleaned up');
  }
}

// Made with Bob