import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState } from './types';
import { createChatSlice } from './slices/chatSlice';
import { createHardwareSlice } from './slices/hardwareSlice';
import { createModelSlice } from './slices/modelSlice';
import { createAuditSlice } from './slices/auditSlice';
import { createUISlice } from './slices/uiSlice';
import { createConversationSlice } from './slices/conversationSlice';

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createChatSlice(...a),
      ...createHardwareSlice(...a),
      ...createModelSlice(...a),
      ...createAuditSlice(...a),
      ...createUISlice(...a),
      ...createConversationSlice(...a),
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
        currentConversationId: state.currentConversationId,
        // Don't persist temporary states
        // isGenerating: false,
        // modelStatus: 'idle',
        // downloadProgress: 0,
        // downloadDetails: null,
        // savedConversations: [], // Don't persist - load from IndexedDB
      }),
    }
  )
);

// Made with Bob
