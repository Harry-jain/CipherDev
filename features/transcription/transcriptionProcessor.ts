import type { TranscriptionSegment } from './types';

/**
 * Transcription processor for handling and formatting transcription segments
 */
export class TranscriptionProcessor {
  /**
   * Assemble segments into a single text string
   */
  static assembleSegments(segments: TranscriptionSegment[]): string {
    return segments
      .map(segment => segment.text)
      .join(' ')
      .trim();
  }

  /**
   * Generate timestamped transcript
   */
  static generateTimestampedTranscript(segments: TranscriptionSegment[]): string {
    return segments
      .map(segment => {
        const timestamp = this.formatTimestamp(segment.timestamp);
        return `[${timestamp}] ${segment.text}`;
      })
      .join('\n');
  }

  /**
   * Format timestamp in MM:SS or HH:MM:SS format
   */
  static formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format duration in human-readable format
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }

  /**
   * Clean up transcription text
   */
  static cleanupText(text: string): string {
    return text
      .trim()
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Fix punctuation spacing
      .replace(/\s+([.,!?;:])/g, '$1')
      // Capitalize first letter
      .replace(/^./, str => str.toUpperCase())
      // Ensure sentence ends with punctuation
      .replace(/([^.!?])$/, '$1.');
  }

  /**
   * Merge consecutive segments with similar timestamps
   */
  static mergeSegments(
    segments: TranscriptionSegment[],
    maxGapSeconds: number = 2
  ): TranscriptionSegment[] {
    if (segments.length === 0) return [];

    const merged: TranscriptionSegment[] = [];
    let current = { ...segments[0] };

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      const gap = segment.timestamp - current.timestamp;

      if (gap <= maxGapSeconds) {
        // Merge with current segment
        current.text = `${current.text} ${segment.text}`.trim();
        // Update confidence to average
        if (current.confidence && segment.confidence) {
          current.confidence = (current.confidence + segment.confidence) / 2;
        }
      } else {
        // Save current and start new segment
        merged.push(current);
        current = { ...segment };
      }
    }

    // Add last segment
    merged.push(current);

    return merged;
  }

  /**
   * Split long segments into smaller chunks
   */
  static splitLongSegments(
    segments: TranscriptionSegment[],
    maxWords: number = 50
  ): TranscriptionSegment[] {
    const result: TranscriptionSegment[] = [];

    for (const segment of segments) {
      const words = segment.text.split(/\s+/);
      
      if (words.length <= maxWords) {
        result.push(segment);
        continue;
      }

      // Split into chunks
      for (let i = 0; i < words.length; i += maxWords) {
        const chunk = words.slice(i, i + maxWords).join(' ');
        result.push({
          id: `${segment.id}_${i / maxWords}`,
          timestamp: segment.timestamp,
          text: chunk,
          confidence: segment.confidence,
        });
      }
    }

    return result;
  }

  /**
   * Extract key phrases from segments
   */
  static extractKeyPhrases(segments: TranscriptionSegment[], minLength: number = 3): string[] {
    const text = this.assembleSegments(segments);
    const words = text.toLowerCase().split(/\s+/);
    const phrases: Map<string, number> = new Map();

    // Extract n-grams (2-4 words)
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const phrase = words.slice(i, i + n).join(' ');
        if (phrase.length >= minLength) {
          phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
        }
      }
    }

    // Sort by frequency and return top phrases
    return Array.from(phrases.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase]) => phrase);
  }

  /**
   * Calculate transcription statistics
   */
  static calculateStats(segments: TranscriptionSegment[]): {
    totalWords: number;
    totalCharacters: number;
    averageConfidence: number;
    duration: number;
    wordsPerMinute: number;
  } {
    const text = this.assembleSegments(segments);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const totalWords = words.length;
    const totalCharacters = text.length;

    const confidences = segments
      .map(s => s.confidence)
      .filter((c): c is number => c !== undefined);
    const averageConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

    const duration = segments.length > 0
      ? segments[segments.length - 1].timestamp
      : 0;

    const wordsPerMinute = duration > 0
      ? (totalWords / duration) * 60
      : 0;

    return {
      totalWords,
      totalCharacters,
      averageConfidence,
      duration,
      wordsPerMinute,
    };
  }

  /**
   * Search segments for a query
   */
  static searchSegments(
    segments: TranscriptionSegment[],
    query: string
  ): TranscriptionSegment[] {
    const lowerQuery = query.toLowerCase();
    return segments.filter(segment =>
      segment.text.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get segment at specific timestamp
   */
  static getSegmentAtTime(
    segments: TranscriptionSegment[],
    timestamp: number
  ): TranscriptionSegment | null {
    for (let i = segments.length - 1; i >= 0; i--) {
      if (segments[i].timestamp <= timestamp) {
        return segments[i];
      }
    }
    return null;
  }
}

// Made with Bob