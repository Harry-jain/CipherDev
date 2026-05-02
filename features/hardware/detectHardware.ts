import { DeviceProfile, DeviceTier } from '@/store/types';
import { classifyDevice } from './classifyDevice';

/**
 * Detects hardware capabilities of the user's device
 * Checks for WebGPU support, GPU info, RAM, CPU cores, and mobile detection
 */
export async function detectHardware(): Promise<DeviceProfile> {
  let hasWebGPU = false;
  let gpuName = 'Unknown';
  let maxBufferSize = 0;
  let memoryTier = 4; // Default to 4GB
  let logicalCores = navigator.hardwareConcurrency || 4;
  let isMobile = false;

  // Detect mobile devices
  const userAgent = navigator.userAgent.toLowerCase();
  isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  // Try to detect WebGPU
  try {
    if ('gpu' in navigator) {
      const adapter = await (navigator as any).gpu.requestAdapter();
      
      if (adapter) {
        hasWebGPU = true;
        
        // Get GPU info
        const info = adapter.info || {};
        gpuName = info.architecture || info.vendor || 'WebGPU Device';
        
        // Get limits
        const limits = adapter.limits || {};
        maxBufferSize = limits.maxBufferSize || 0;
      }
    }
  } catch (error) {
    console.warn('WebGPU detection failed:', error);
    hasWebGPU = false;
  }

  // Estimate memory tier
  if ('deviceMemory' in navigator) {
    memoryTier = (navigator as any).deviceMemory || 4;
  } else {
    // Fallback estimation based on other factors
    if (hasWebGPU && maxBufferSize >= 2_000_000_000) {
      memoryTier = 8;
    } else if (hasWebGPU) {
      memoryTier = 4;
    } else {
      memoryTier = 2;
    }
  }

  // Classify device tier
  const tier: DeviceTier = classifyDevice({
    hasWebGPU,
    maxBufferSize,
    memoryTier,
  });

  const profile: DeviceProfile = {
    hasWebGPU,
    gpuName,
    maxBufferSize,
    memoryTier,
    logicalCores,
    isMobile,
    tier,
  };

  console.log('Hardware Profile:', profile);
  return profile;
}

// Made with Bob
