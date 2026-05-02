import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState } from './types';
import { createChatSlice } from './slices/chatSlice';
import { createHardwareSlice } from './slices/hardwareSlice';
import { createModelSlice } from './slices/modelSlice';
import { createAuditSlice } from './slices/auditSlice';
import { createUISlice } from './slices/uiSlice';

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createChatSlice(...a),
      ...createHardwareSlice(...a),
      ...createModelSlice(...a),
      ...createAuditSlice(...a),
      ...createUISlice(...a),
    }),
    {
      name: 'chipherdev-storage',
      storage: createJSONStorage(() => sessionStorage),
      // Persist everything except UI state and temporary progress
      partialize: (state) => ({
        messages: state.messages,
        deviceProfile: state.deviceProfile,
        selectedModelId: state.selectedModelId,
        loadedModelId: state.loadedModelId,
        // Don't persist temporary states
        // isGenerating: false,
        // modelStatus: 'idle',
        // downloadProgress: 0,
        // downloadDetails: null,
      }),
    }
  )
);

// Made with Bob
