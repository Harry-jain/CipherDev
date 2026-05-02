import { InferenceEngine } from './llm.types';

let currentEngine: InferenceEngine | null = null;

export async function getEngine(hasWebGPU: boolean): Promise<InferenceEngine> {
  // If we already have an engine, return it
  if (currentEngine) {
    return currentEngine;
  }

  // Dynamically import the appropriate engine
  if (hasWebGPU) {
    const { WebGPUEngine } = await import('./webgpuEngine');
    currentEngine = new WebGPUEngine();
  } else {
    const { WasmEngine } = await import('./wasmEngine');
    currentEngine = new WasmEngine();
  }

  if (!currentEngine) {
    throw new Error('Failed to initialize engine');
  }

  return currentEngine;
}

export function resetEngine(): void {
  if (currentEngine) {
    currentEngine.unload();
    currentEngine = null;
  }
}

export function getCurrentEngine(): InferenceEngine | null {
  return currentEngine;
}

// Made with Bob
