import type { MicVAD } from '@ricky0123/vad-web';
import type { VADEvent } from './types';

/**
 * VAD-driven audio capture.
 *
 * Uses @ricky0123/vad-web to detect speech utterances and emit raw 16kHz mono
 * PCM (Float32Array) per utterance. This replaces the previous MediaRecorder
 * chunking approach, which was broken because chunks 2+ lacked WebM headers
 * and failed to decode.
 *
 * VAD assets (silero_vad_legacy.onnx, vad.worklet.bundle.min.js, ort wasm) are
 * served from /public/ at the site root.
 */
export class AudioCapture {
  private vad: MicVAD | null = null;
  private audioStream: MediaStream | null = null;
  private analyserContext: AudioContext | null = null;
  private analyserRaf: number | null = null;

  private isRecording = false;
  private isPaused = false;
  private recordingStartTime = 0;
  private pausedDuration = 0;
  private lastPauseTime = 0;

  // Callbacks
  private onSpeechStartCallback?: (event: VADEvent) => void;
  private onSpeechEndCallback?: (event: VADEvent) => void;
  private onAudioLevelCallback?: (level: number) => void;
  private onSpeechAudioCallback?: (audio: Float32Array, timestamp: number) => void;

  /**
   * Request mic permission and initialize VAD.
   */
  async initialize(): Promise<void> {
    this.audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const { MicVAD } = await import('@ricky0123/vad-web');
    const sharedStream = this.audioStream;

    this.vad = await MicVAD.new({
      // Reuse the stream we already requested so the analyser and VAD see the
      // same audio and the user only sees one mic permission prompt.
      getStream: async () => sharedStream,
      pauseStream: async () => {},
      resumeStream: async () => sharedStream,
      // Assets are copied into /public during the build.
      baseAssetPath: '/',
      onnxWASMBasePath: '/',
      model: 'legacy',
      startOnLoad: false,

      // Tuned for live meeting transcription:
      // - Higher thresholds reject keyboard taps / HVAC noise that would
      //   otherwise trigger spurious Whisper inference calls.
      // - Shorter redemption (was 1400ms default) cuts the silent-pause-before
      //   -firing in half, so transcripts feel snappier. A long thinking pause
      //   may split an utterance in two — acceptable tradeoff for live UX.
      positiveSpeechThreshold: 0.5,
      negativeSpeechThreshold: 0.35,
      redemptionMs: 700,

      onSpeechStart: () => {
        this.onSpeechStartCallback?.({
          type: 'speech-start',
          timestamp: this.getCurrentTimestamp(),
          audioLevel: 0.8,
        });
      },
      onSpeechEnd: (audio: Float32Array) => {
        const timestamp = this.getCurrentTimestamp();
        this.onSpeechEndCallback?.({
          type: 'speech-end',
          timestamp,
          audioLevel: 0.2,
        });
        // Hand the raw PCM to whoever is listening (typically the page, which
        // forwards it to WhisperEngine.transcribePCM).
        this.onSpeechAudioCallback?.(audio, timestamp);
      },
      onVADMisfire: () => {
        // Speech start was detected but the segment was too short — ignore.
      },
    } as any);
  }

  async startRecording(): Promise<void> {
    if (!this.vad || !this.audioStream) {
      throw new Error('Audio capture not initialized. Call initialize() first.');
    }
    if (this.isRecording) return;

    this.recordingStartTime = Date.now();
    this.pausedDuration = 0;
    this.isRecording = true;
    this.isPaused = false;

    await this.vad.start();
    this.startAudioLevelMonitoring();
  }

  /**
   * Stop recording. There is no final blob to transcribe — every utterance has
   * already been emitted via onSpeechEnd. Returns an empty Blob for backwards
   * compatibility with the previous signature.
   */
  async stopRecording(): Promise<Blob> {
    if (!this.isRecording) return new Blob([]);

    this.isRecording = false;
    this.isPaused = false;

    if (this.vad) {
      await this.vad.pause();
    }
    this.stopAudioLevelMonitoring();

    return new Blob([]);
  }

  pauseRecording(): void {
    if (!this.isRecording || this.isPaused) return;
    this.isPaused = true;
    this.lastPauseTime = Date.now();
    this.vad?.pause();
    this.stopAudioLevelMonitoring();
  }

  resumeRecording(): void {
    if (!this.isRecording || !this.isPaused) return;
    this.pausedDuration += Date.now() - this.lastPauseTime;
    this.isPaused = false;
    this.vad?.start();
    this.startAudioLevelMonitoring();
  }

  private getCurrentTimestamp(): number {
    if (!this.isRecording) return 0;
    // While paused, freeze the clock at the moment pause was hit so the UI
    // timer (which polls this) stops incrementing until resume.
    const now = this.isPaused ? this.lastPauseTime : Date.now();
    const elapsed = now - this.recordingStartTime - this.pausedDuration;
    return elapsed / 1000;
  }

  private startAudioLevelMonitoring(): void {
    if (!this.audioStream || this.analyserRaf !== null) return;

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(this.audioStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      this.analyserContext = ctx;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!this.isRecording || this.isPaused) {
          this.analyserRaf = null;
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        this.onAudioLevelCallback?.(avg / 255);
        this.analyserRaf = requestAnimationFrame(tick);
      };
      this.analyserRaf = requestAnimationFrame(tick);
    } catch (error) {
      console.error('Failed to start audio level monitoring:', error);
    }
  }

  private stopAudioLevelMonitoring(): void {
    if (this.analyserRaf !== null) {
      cancelAnimationFrame(this.analyserRaf);
      this.analyserRaf = null;
    }
    if (this.analyserContext) {
      this.analyserContext.close().catch(() => undefined);
      this.analyserContext = null;
    }
  }

  onSpeechStart(callback: (event: VADEvent) => void): void {
    this.onSpeechStartCallback = callback;
  }

  onSpeechEnd(callback: (event: VADEvent) => void): void {
    this.onSpeechEndCallback = callback;
  }

  onAudioLevel(callback: (level: number) => void): void {
    this.onAudioLevelCallback = callback;
  }

  /**
   * Receive raw 16kHz mono PCM for each detected speech utterance.
   * Pass the Float32Array directly to WhisperEngine.transcribePCM().
   */
  onSpeechAudio(callback: (audio: Float32Array, timestamp: number) => void): void {
    this.onSpeechAudioCallback = callback;
  }

  /**
   * Kept for backwards compatibility with the previous chunk-based API. The
   * VAD path no longer emits raw chunks — use onSpeechAudio instead.
   */
  onDataAvailable(_callback: unknown): void {
    // no-op
  }

  getStatus(): { isRecording: boolean; isPaused: boolean; duration: number } {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      duration: this.getCurrentTimestamp(),
    };
  }

  async cleanup(): Promise<void> {
    if (this.isRecording) {
      try {
        await this.stopRecording();
      } catch (error) {
        console.error('Error stopping recording during cleanup:', error);
      }
    }

    if (this.vad) {
      await this.vad.destroy();
      this.vad = null;
    }

    this.stopAudioLevelMonitoring();

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(t => t.stop());
      this.audioStream = null;
    }

    this.isRecording = false;
    this.isPaused = false;
  }
}
