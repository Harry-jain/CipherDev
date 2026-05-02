import { StateCreator } from 'zustand';
import { ModelState } from '../types';

export const createModelSlice: StateCreator<ModelState> = (set) => ({
  selectedModelId: null,
  loadedModelId: null,
  modelStatus: 'idle',
  downloadProgress: 0,
  downloadDetails: null,
  compilingProgress: 0,
  error: null,

  setSelectedModel: (modelId) => set({ selectedModelId: modelId }),

  setModelStatus: (status) => set({ modelStatus: status }),

  setDownloadProgress: (progress) => set({ downloadProgress: progress }),

  setDownloadDetails: (details) => set({ downloadDetails: details }),

  setCompilingProgress: (progress) => set({ compilingProgress: progress }),

  setLoadedModel: (modelId) =>
    set({
      loadedModelId: modelId,
      modelStatus: 'loaded',
      downloadProgress: 100,
      downloadDetails: null,
      compilingProgress: 100,
      error: null,
    }),

  setError: (error) =>
    set({
      error,
      modelStatus: 'error',
    }),

  reset: () =>
    set({
      selectedModelId: null,
      loadedModelId: null,
      modelStatus: 'idle',
      downloadProgress: 0,
      downloadDetails: null,
      compilingProgress: 0,
      error: null,
    }),
});

// Made with Bob
