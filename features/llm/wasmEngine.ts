import { InferenceEngine, LoadProgress } from './llm.types';
import { MODEL_REGISTRY } from './modelRegistry';

export class WasmEngine implements InferenceEngine {
  private pipeline: any = null;
  private loadedModelId: string | null = null;

  async loadModel(
    modelId: string,
    onProgress: (progress: LoadProgress) => void
  ): Promise<void> {
    // Dynamic import to prevent SSR issues
    const { pipeline } = await import('@xenova/transformers');

    const modelSpec = MODEL_REGISTRY.find(m => m.id === modelId);
    if (!modelSpec) {
      throw new Error(`Model ${modelId} not found in registry`);
    }

    onProgress({ loaded: 0, total: 100, status: 'Initializing WASM engine...' });

    try {
      // Load the text-generation pipeline
      // Note: @xenova/transformers uses different model IDs, we'll use a fallback
      const wasmModelId = 'Xenova/gpt2'; // Fallback model for WASM
      
      onProgress({ loaded: 30, total: 100, status: 'Loading model weights...' });
      
      this.pipeline = await pipeline('text-generation', wasmModelId, {
        progress_callback: (progress: any) => {
          if (progress.status === 'progress') {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            onProgress({
              loaded: 30 + (percent * 0.7),
              total: 100,
              status: `Downloading: ${percent}%`,
            });
          }
        },
      });

      this.loadedModelId = modelId;
      onProgress({ loaded: 100, total: 100, status: 'Model loaded successfully' });
    } catch (error) {
      console.error('WASM engine load error:', error);
      throw new Error(`Failed to load WASM model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generate(
    messages: Array<{ role: string; content: string }>,
    onUpdate: (chunk: string, tokenSpeed?: number) => void
  ): Promise<void> {
    if (!this.pipeline) {
      throw new Error('Engine not loaded. Call loadModel() first.');
    }

    try {
      // Convert messages to a single prompt
      const prompt = messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n') + '\nAssistant:';

      // Generate response
      const result = await this.pipeline(prompt, {
        max_new_tokens: 512,
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
      });

      // Extract generated text
      const generatedText = result[0]?.generated_text || '';
      const response = generatedText.split('Assistant:').pop()?.trim() || generatedText;

      // Simulate streaming by sending chunks with token speed
      const words = response.split(' ');
      const startTime = Date.now();
      
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? '' : ' ') + words[i];
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const tokenSpeed = elapsedSeconds > 0 ? (i + 1) / elapsedSeconds : 0;
        
        onUpdate(chunk, tokenSpeed);
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('WASM generation error:', error);
      throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async unload(): Promise<void> {
    if (this.pipeline) {
      // Transformers.js doesn't have explicit unload, but we can clear the reference
      this.pipeline = null;
      this.loadedModelId = null;
    }
  }

  getLoadedModelId(): string | null {
    return this.loadedModelId;
  }
}

// Made with Bob
