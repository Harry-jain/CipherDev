'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WHISPER_MODELS, getRecommendedWhisperModelId } from '@/features/llm/modelRegistry';
import type { DeviceTier } from '@/store/types';

interface WhisperModelSelectorProps {
  deviceTier: DeviceTier | null;
  onLoadModel: (modelId: string) => void;
  disabled?: boolean;
}

export function WhisperModelSelector({
  deviceTier,
  onLoadModel,
  disabled = false,
}: WhisperModelSelectorProps) {
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  // Get recommended model based on device tier
  const recommendedModelId = deviceTier
    ? getRecommendedWhisperModelId(deviceTier)
    : 'whisper-base';

  // Get compatible models for the device tier
  const compatibleModels = deviceTier
    ? WHISPER_MODELS.filter((model) => model.tiers.includes(deviceTier))
    : WHISPER_MODELS;

  const handleLoadClick = () => {
    if (selectedModelId) {
      onLoadModel(selectedModelId);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Select Whisper Model</h3>
          <p className="text-sm text-gray-400 mt-1">
            Choose a speech-to-text model for transcription
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="whisper-model" className="text-sm font-medium text-gray-300">
            Model
          </label>
          <select
            id="whisper-model"
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select a model...</option>
            {compatibleModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.size}MB) - {model.description}
              </option>
            ))}
          </select>
        </div>

        {selectedModelId && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Selected:</span>
            <Badge variant="info">
              {WHISPER_MODELS.find((m) => m.id === selectedModelId)?.name}
            </Badge>
            {selectedModelId === recommendedModelId && (
              <Badge variant="success">Recommended</Badge>
            )}
          </div>
        )}

        <Button
          onClick={handleLoadClick}
          disabled={!selectedModelId || disabled}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          Load Model
        </Button>

        {deviceTier && (
          <p className="text-xs text-gray-500 text-center">
            Recommended for your device: {WHISPER_MODELS.find((m) => m.id === recommendedModelId)?.name}
          </p>
        )}
      </div>
    </Card>
  );
}

// Made with Bob