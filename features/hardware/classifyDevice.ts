import { DeviceTier } from '@/store/types';

interface ClassificationInput {
  hasWebGPU: boolean;
  maxBufferSize: number;
  memoryTier: number;
}

/**
 * Classifies device into performance tiers based on hardware capabilities
 * 
 * Tiers:
 * - High: WebGPU + 2GB+ buffer + 8GB+ RAM
 * - Mid: WebGPU + 4GB+ RAM
 * - Low: WebGPU (any)
 * - Minimal: No WebGPU
 */
export function classifyDevice(input: ClassificationInput): DeviceTier {
  const { hasWebGPU, maxBufferSize, memoryTier } = input;

  if (!hasWebGPU) {
    return 'minimal';
  }

  // High tier: Large buffer and high memory
  if (maxBufferSize >= 2_000_000_000 && memoryTier >= 8) {
    return 'high';
  }

  // Mid tier: WebGPU with decent memory
  if (memoryTier >= 4) {
    return 'mid';
  }

  // Low tier: WebGPU but limited resources
  return 'low';
}

// Made with Bob
