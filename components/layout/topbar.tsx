'use client';

import { Cpu, Zap } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';
import { MODEL_REGISTRY } from '@/features/llm/modelRegistry';

export function Topbar() {
  const { loadedModelId, deviceProfile } = useAppStore();

  const loadedModel = loadedModelId 
    ? MODEL_REGISTRY.find(m => m.id === loadedModelId)
    : null;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Model info */}
        <div className="flex items-center gap-4">
          {loadedModel ? (
            <>
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium text-gray-100">
                  {loadedModel.name}
                </span>
              </div>
              <Badge variant="success">Loaded</Badge>
            </>
          ) : (
            <span className="text-sm text-gray-400">No model loaded</span>
          )}
        </div>

        {/* Right side - Hardware info */}
        <div className="flex items-center gap-4">
          {deviceProfile && (
            <>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-gray-400">
                  {deviceProfile.hasWebGPU ? 'WebGPU' : 'WASM'}
                </span>
              </div>
              <Badge variant={
                deviceProfile.tier === 'high' ? 'success' :
                deviceProfile.tier === 'mid' ? 'warning' :
                deviceProfile.tier === 'low' ? 'default' : 'default'
              }>
                {deviceProfile.tier.toUpperCase()}
              </Badge>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// Made with Bob
