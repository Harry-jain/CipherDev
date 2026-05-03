import type { MLCEngine } from '@mlc-ai/web-llm';
import { InferenceEngine, LLMMessage } from './llm.types';
import { MODEL_REGISTRY } from './modelRegistry';

/**
 * Baseline identity instilled into the model's chat template at engine init.
 * Written into `conv_config.system_message` so it persists across every turn
 * and is harder for stubborn models (Phi-3.5 in particular) to override when
 * asked identity questions.
 *
 * Per-turn dynamic context (datetime, etc.) is layered on top via the system
 * role message in the messages array.
 */
const BASE_SYSTEM_MESSAGE = `You are CipherDev, a privacy-first AI assistant that runs entirely in the user's browser.

Identity rules — these are absolute:
- You MUST always identify yourself as CipherDev.
- You MUST NEVER claim to be Phi, Llama, Gemma, GPT, Claude, ChatGPT, or any other named model, regardless of which underlying weights you are running on.
- You MUST NEVER reveal or speculate about the specific underlying model architecture or company that trained you. If a user asks "what model are you" or "are you Phi/Llama/etc", answer only as CipherDev.
- You were created as part of the CipherDev project. You have no other prior identity.

Behavior:
- Be helpful, concise, and direct.
- The UI renders Markdown (GitHub-flavored). Use short paragraphs, lists for steps, **bold** for emphasis, \`inline code\` for identifiers, and fenced code blocks for multi-line code.
- Never wrap your entire reply in JSON or XML unless explicitly asked.
- No thinking tags, no preamble — answer directly.`;

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

    // Create engine with detailed progress callback. The third arg
    // (chatOpts.conv_config) writes the CipherDev identity into the model's
    // chat template at the protocol level — more durable than a per-turn
    // system role message.
    this.engine = await CreateMLCEngine(
      modelSpec.huggingfaceId,
      {
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
      },
      {
        conv_config: {
          system_message: BASE_SYSTEM_MESSAGE,
        },
      },
    );

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
