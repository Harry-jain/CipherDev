import type { MLCEngine } from '@mlc-ai/web-llm';
import { InferenceEngine, LLMMessage } from './llm.types';
import { MODEL_REGISTRY } from './modelRegistry';

export class WebGPUEngine implements InferenceEngine {
  private engine: MLCEngine | null = null;
  private loadedModelId: string | null = null;

  async loadModel(
    modelId: string,
    onProgress: (progress: { loaded: number; total: number; status: string; details?: any }) => void
  ): Promise<void> {
    // Dynamic import to prevent SSR issues
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

    const modelSpec = MODEL_REGISTRY.find(m => m.id === modelId);
    if (!modelSpec) {
      throw new Error(`Model ${modelId} not found in registry`);
    }

    let lastProgressUpdate = 0;

    // Create engine with detailed progress callback
    this.engine = await CreateMLCEngine(modelSpec.huggingfaceId, {
      initProgressCallback: (report) => {
        if (onProgress) {
          // Extract shard information from status text
          const shardMatch = report.text?.match(/\[(\d+)\/(\d+)\]/);
          
          let details = undefined;
          if (shardMatch) {
            const current = parseInt(shardMatch[1]);
            const total = parseInt(shardMatch[2]);
            details = {
              currentShard: current,
              totalShards: total,
              completedShards: Math.max(0, current - 1),
              loaded: current,
              total: total,
            };
          }

          // Calculate progress percentage
          const progressPercent = report.progress ? report.progress * 100 : 0;

          // Throttle state updates to max 10 FPS (100ms) to prevent UI freezing
          const now = Date.now();
          if (now - lastProgressUpdate > 100 || progressPercent === 100) {
            onProgress({
              loaded: progressPercent,
              total: 100,
              status: report.text || 'Loading...',
              details,
            });
            lastProgressUpdate = now;
          }
        }
      },
    });

    this.loadedModelId = modelId;
  }

  async generate(
    messages: Array<{ role: string; content: string }>,
    onUpdate: (chunk: string, tokenSpeed?: number) => void,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<void> {
    if (!this.engine) {
      throw new Error('Engine not loaded. Call loadModel() first.');
    }

    // Convert messages to the format expected by MLC
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    let fullResponse = '';
    let tokenCount = 0;
    const startTime = Date.now();
    let lastUpdateTime = startTime;
    let tokensInLastSecond = 0;

    try {
      const completion = await this.engine.chat.completions.create({
        messages: formattedMessages as any,
        stream: true,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
      });

      // Stream the response with accurate token speed tracking
      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullResponse += delta;
          
          // Count tokens more accurately (approximate by words)
          const newTokens = delta.split(/\s+/).filter(t => t.length > 0).length;
          tokenCount += newTokens;
          tokensInLastSecond += newTokens;
          
          const now = Date.now();
          const elapsedSeconds = (now - startTime) / 1000;
          
          // Calculate instantaneous speed (tokens in last second)
          if (now - lastUpdateTime >= 1000) {
            const instantSpeed = tokensInLastSecond;
            tokensInLastSecond = 0;
            lastUpdateTime = now;
            onUpdate(delta, instantSpeed);
          } else {
            // Calculate average speed
            const avgSpeed = elapsedSeconds > 0 ? tokenCount / elapsedSeconds : 0;
            onUpdate(delta, avgSpeed);
          }
        }
      }
      
      // Final update with accurate average speed
      const totalSeconds = (Date.now() - startTime) / 1000;
      const finalSpeed = totalSeconds > 0 ? tokenCount / totalSeconds : 0;
      console.log(`Generation complete: ${tokenCount} tokens in ${totalSeconds.toFixed(2)}s (${finalSpeed.toFixed(1)} t/s)`);
      
    } catch (error) {
      console.error('WebGPU generation error:', error);
      throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async unload(): Promise<void> {
    if (this.engine) {
      // MLC engine doesn't have explicit unload, but we can clear the reference
      this.engine = null;
      this.loadedModelId = null;
    }
  }

  getLoadedModelId(): string | null {
    return this.loadedModelId;
  }
}

// Made with Bob
