'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cpu, Zap, HardDrive, Gauge, Download, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { detectHardware } from '@/features/hardware/detectHardware';
import { getRecommendedModelId, MODEL_REGISTRY } from '@/features/llm/modelRegistry';
import { getEngine, resetEngine } from '@/features/llm/engineFactory';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export const dynamic = 'force-dynamic';

export default function ModelsPage() {
  const router = useRouter();
  const {
    deviceProfile,
    setDeviceProfile,
    selectedModelId,
    setSelectedModel,
    modelStatus,
    setModelStatus,
    downloadProgress,
    downloadDetails,
    setDownloadProgress,
    setDownloadDetails,
    setLoadedModel,
    loadedModelId,
    setError,
  } = useAppStore();

  const [isDetecting, setIsDetecting] = useState(true);
  const [loadingModelId, setLoadingModelId] = useState<string | null>(null);

  useEffect(() => {
    async function detect() {
      try {
        const profile = await detectHardware();
        setDeviceProfile(profile);
        
        // Auto-select recommended model
        const recommendedId = getRecommendedModelId(profile.tier);
        setSelectedModel(recommendedId);
      } catch (error) {
        console.error('Hardware detection failed:', error);
        setError('Failed to detect hardware capabilities');
      } finally {
        setIsDetecting(false);
      }
    }

    detect();
  }, [setDeviceProfile, setSelectedModel, setError]);

  // Recover from stale transient state (e.g., navigated away mid-load)
  useEffect(() => {
    if (modelStatus === 'downloading' || modelStatus === 'compiling') {
      setModelStatus('idle');
      setDownloadProgress(0);
      setDownloadDetails(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadModel = async (modelId: string) => {
    setLoadingModelId(modelId);
    setSelectedModel(modelId);

    try {
      // Switching to a different model than what's currently loaded → fresh engine
      if (loadedModelId && loadedModelId !== modelId) {
        resetEngine();
      }

      setModelStatus('downloading');
      setDownloadProgress(0);
      setDownloadDetails({
        loaded: 0,
        total: 100,
        percentage: 0,
        status: 'Initializing model loader...',
      });
      setError(null);

      // Get the appropriate engine
      const engine = await getEngine(deviceProfile?.hasWebGPU || false);

      // Load the model with detailed progress tracking
      await engine.loadModel(modelId, (progress) => {
        setDownloadProgress(progress.loaded);
        
        // Update detailed progress if available
        if (progress.details || progress.status) {
          setDownloadDetails({
            loaded: progress.loaded,
            total: progress.total,
            percentage: progress.loaded,
            status: progress.status,
            currentShard: progress.details?.currentShard,
            totalShards: progress.details?.totalShards,
            completedShards: progress.details?.completedShards,
          });
        }
        
        if (progress.loaded >= 90) {
          setModelStatus('compiling');
        }
      });

      // Mark as loaded
      setModelStatus('loaded');
      setLoadedModel(modelId);
      setDownloadProgress(100);
      setDownloadDetails({
        loaded: 100,
        total: 100,
        percentage: 100,
        status: 'Model ready',
      });

      // Keep the progress UI visible briefly so cached/fast loads are perceptible
      setTimeout(() => {
        setLoadingModelId(null);
        setDownloadDetails(null);
        router.push('/chat');
      }, 600);
    } catch (error) {
      console.error('Model loading failed:', error);
      setModelStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to load model');
      setDownloadDetails(null);
      setLoadingModelId(null);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'high': return 'success';
      case 'mid': return 'warning';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const recommendedModelId = deviceProfile ? getRecommendedModelId(deviceProfile.tier) : null;

  return (
    <div className="min-h-full p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-100">Select Model</h1>
          <p className="text-gray-400">
            Choose an AI model based on your device capabilities
          </p>
        </div>

        {/* Hardware Detection Banner */}
        {isDetecting ? (
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin">
                <Gauge className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-gray-300">Detecting hardware capabilities...</span>
            </div>
          </Card>
        ) : deviceProfile ? (
          <Card className="p-6 bg-blue-900/20 border-blue-800/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-100">Hardware Profile</h2>
                <Badge variant={getTierColor(deviceProfile.tier)}>
                  {deviceProfile.tier.toUpperCase()} TIER
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-500">GPU</p>
                    <p className="text-sm text-gray-300 font-medium">
                      {deviceProfile.hasWebGPU ? deviceProfile.gpuName : 'WASM Only'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-500">Backend</p>
                    <p className="text-sm text-gray-300 font-medium">
                      {deviceProfile.hasWebGPU ? 'WebGPU' : 'WASM'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-500">RAM</p>
                    <p className="text-sm text-gray-300 font-medium">
                      {deviceProfile.memoryTier}GB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-500">Cores</p>
                    <p className="text-sm text-gray-300 font-medium">
                      {deviceProfile.logicalCores}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Model Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {MODEL_REGISTRY.map((model) => {
            const isRecommended = model.id === recommendedModelId;
            const isSelected = model.id === selectedModelId;
            const isLoading = loadingModelId !== null;
            const isThisModelLoading = loadingModelId === model.id;
            const canLoad = deviceProfile && model.tiers.includes(deviceProfile.tier);

            return (
              <Card
                key={model.id}
                className={`p-6 space-y-4 transition-all ${
                  isRecommended ? 'ring-2 ring-blue-500 glow' : ''
                } ${isSelected ? 'border-blue-600' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100">{model.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{model.description}</p>
                  </div>
                  {isRecommended && (
                    <Badge variant="success">Recommended</Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <span className="text-gray-300 ml-2 font-medium">
                      {(model.size / 1024).toFixed(1)}GB
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tiers:</span>
                    <span className="text-gray-300 ml-2 font-medium">
                      {model.tiers.map(t => t.toUpperCase()).join(', ')}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handleLoadModel(model.id)}
                  disabled={!canLoad || isLoading}
                  className="w-full"
                  variant={isRecommended ? 'primary' : 'secondary'}
                >
                  {isThisModelLoading ? (
                    <>
                      <Download className="h-4 w-4 mr-2 animate-pulse" />
                      Loading...
                    </>
                  ) : canLoad ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Load Model
                    </>
                  ) : (
                    'Incompatible'
                  )}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Loading Progress */}
        {loadingModelId !== null && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-800/50 backdrop-blur-sm p-4 md:pl-64">
            <div className="max-w-6xl mx-auto space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="space-y-1">
                  <span className="text-gray-300 font-medium">
                    {modelStatus === 'loaded'
                      ? 'Model ready'
                      : modelStatus === 'compiling'
                      ? 'Compiling model...'
                      : downloadDetails?.status || 'Initializing model loader...'}
                  </span>
                  {downloadDetails && downloadDetails.totalShards && (
                    <p className="text-xs text-gray-500">
                      Shard {downloadDetails.currentShard} of {downloadDetails.totalShards}
                      {' '}({downloadDetails.completedShards} completed)
                    </p>
                  )}
                </div>
                <span className="text-gray-400 font-mono">{Math.round(downloadProgress)}%</span>
              </div>
              <Progress value={downloadProgress} showLabel={false} />
              
              {/* Shard Visualizer */}
              {downloadDetails && downloadDetails.totalShards && (
                <div className="mt-4 flex flex-wrap gap-1 justify-center">
                  {Array.from({ length: downloadDetails.totalShards }).map((_, i) => {
                    const isCompleted = i < (downloadDetails.completedShards || 0);
                    const isCurrent = i === ((downloadDetails.currentShard || 1) - 1);
                    return (
                      <div
                        key={i}
                        title={`Shard ${i + 1}`}
                        className={`h-2 w-4 rounded-sm transition-colors ${
                          isCompleted
                            ? 'bg-blue-500'
                            : isCurrent
                            ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                            : 'bg-gray-800 border border-gray-700'
                        }`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
