import { ModelSpec, DeviceTier } from '@/store/types';

/**
 * Registry of available LLM models
 * Each model is optimized for different hardware tiers
 */
export const MODEL_REGISTRY: ModelSpec[] = [
  {
    id: 'tinyllama-1.1b',
    name: 'TinyLlama 1.1B',
    huggingfaceId: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC',
    size: 650, // MB
    tiers: ['minimal', 'low', 'mid', 'high'],
    description: 'Smallest model, runs on any device including WASM fallback',
  },
  {
    id: 'gemma-2-2b-it',
    name: 'Gemma 2 2B Instruct',
    huggingfaceId: 'gemma-2-2b-it-q4f16_1-MLC',
    size: 1400, // MB
    tiers: ['low', 'mid', 'high'],
    description: 'Balanced performance and quality for mid-range devices',
  },
  {
    id: 'llama-3.2-3b-instruct',
    name: 'Llama 3.2 3B Instruct',
    huggingfaceId: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    size: 1900, // MB
    tiers: ['mid', 'high'],
    description: 'High-quality responses for capable devices',
  },
  {
    id: 'phi-3.5-mini-instruct',
    name: 'Phi-3.5 Mini Instruct',
    huggingfaceId: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    size: 2200, // MB
    tiers: ['high'],
    description: 'Best quality, requires high-end hardware',
  },
];

/**
 * Get model specification by ID
 */
export function getModelById(modelId: string): ModelSpec | undefined {
  return MODEL_REGISTRY.find((model) => model.id === modelId);
}

/**
 * Get recommended model for a device tier
 */
export function getRecommendedModelId(tier: DeviceTier): string {
  switch (tier) {
    case 'high':
      return 'phi-3.5-mini-instruct';
    case 'mid':
      return 'llama-3.2-3b-instruct';
    case 'low':
      return 'gemma-2-2b-it';
    case 'minimal':
    default:
      return 'tinyllama-1.1b';
  }
}

/**
 * Get all models compatible with a device tier
 */
export function getCompatibleModels(tier: DeviceTier): ModelSpec[] {
  return MODEL_REGISTRY.filter((model) => model.tiers.includes(tier));
}

// Made with Bob
