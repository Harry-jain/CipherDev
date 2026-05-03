import { StateCreator } from 'zustand';
import { ConversationState } from '../types';
import { conversationStorage } from '@/features/conversations/storage';
import { SavedConversation } from '@/features/conversations/types';
import {
  generateConversationTitle,
  generatePreview,
  generateConversationId,
} from '@/features/conversations/utils';

export const createConversationSlice: StateCreator<ConversationState> = (set, get) => ({
  savedConversations: [],
  currentConversationId: null,
  isLoadingConversations: false,
  isSavingConversation: false,

  /**
   * Load all conversation metadata from IndexedDB
   */
  loadConversationsList: async () => {
    set({ isLoadingConversations: true });
    
    try {
      await conversationStorage.init();
      const metadata = await conversationStorage.getAllMetadata();
      set({ savedConversations: metadata });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  /**
   * Save current conversation to IndexedDB
   */
  saveCurrentConversation: async (title?: string) => {
    const state = get() as any;
    const { messages, loadedModelId, currentConversationId } = state;

    if (messages.length === 0) {
      return; // Nothing to save
    }

    set({ isSavingConversation: true });

    try {
      await conversationStorage.init();

      // Use existing ID or generate new one
      const conversationId = currentConversationId || generateConversationId();
      
      // Generate title if not provided
      const conversationTitle = title || generateConversationTitle(messages);
      
      const conversation: SavedConversation = {
        id: conversationId,
        metadata: {
          id: conversationId,
          title: conversationTitle,
          createdAt: currentConversationId ? 
            (await conversationStorage.getConversation(conversationId))?.metadata.createdAt || Date.now() : 
            Date.now(),
          updatedAt: Date.now(),
          messageCount: messages.length,
          modelId: loadedModelId || 'unknown',
          preview: generatePreview(messages),
        },
        messages,
      };

      await conversationStorage.saveConversation(conversation);
      
      // Update state
      set({ currentConversationId: conversationId });
      
      // Reload conversation list
      const metadata = await conversationStorage.getAllMetadata();
      set({ savedConversations: metadata });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    } finally {
      set({ isSavingConversation: false });
    }
  },

  /**
   * Load a conversation from IndexedDB
   */
  loadConversation: async (id: string) => {
    set({ isLoadingConversations: true });

    try {
      await conversationStorage.init();
      const conversation = await conversationStorage.getConversation(id);

      if (conversation) {
        const state = get() as any;
        
        // Clear current messages and load new ones
        state.clearHistory();
        
        // Set messages
        conversation.messages.forEach(msg => {
          state.addMessage(msg);
        });

        // Set current conversation ID
        set({ currentConversationId: id });
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  /**
   * Delete a conversation
   */
  deleteConversation: async (id: string) => {
    try {
      await conversationStorage.init();
      await conversationStorage.deleteConversation(id);

      // If we deleted the current conversation, clear it
      const state = get() as any;
      if (state.currentConversationId === id) {
        set({ currentConversationId: null });
      }

      // Reload conversation list
      const metadata = await conversationStorage.getAllMetadata();
      set({ savedConversations: metadata });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  },

  /**
   * Update conversation title
   */
  updateConversationTitle: async (id: string, title: string) => {
    try {
      await conversationStorage.init();
      await conversationStorage.updateMetadata(id, { title });

      // Reload conversation list
      const metadata = await conversationStorage.getAllMetadata();
      set({ savedConversations: metadata });
    } catch (error) {
      console.error('Failed to update conversation title:', error);
    }
  },

  /**
   * Create a new conversation (clear current)
   */
  createNewConversation: () => {
    const state = get() as any;
    state.clearHistory();
    set({ currentConversationId: null });
  },

  /**
   * Auto-save current conversation after each message
   */
  autoSaveConversation: async () => {
    const state = get() as any;
    const { messages, currentConversationId } = state;

    if (messages.length === 0) {
      return;
    }

    try {
      await conversationStorage.init();

      // Use existing ID or generate new one
      const conversationId = currentConversationId || generateConversationId();
      
      // Get existing conversation to preserve created date
      let createdAt = Date.now();
      if (currentConversationId) {
        const existing = await conversationStorage.getConversation(conversationId);
        if (existing) {
          createdAt = existing.metadata.createdAt;
        }
      }

      const conversation: SavedConversation = {
        id: conversationId,
        metadata: {
          id: conversationId,
          title: generateConversationTitle(messages),
          createdAt,
          updatedAt: Date.now(),
          messageCount: messages.length,
          modelId: state.loadedModelId || 'unknown',
          preview: generatePreview(messages),
        },
        messages,
      };

      await conversationStorage.saveConversation(conversation);
      
      // Update current conversation ID if it's new
      if (!currentConversationId) {
        set({ currentConversationId: conversationId });
      }

      // Silently update conversation list (don't reload to avoid UI flicker)
      const metadata = await conversationStorage.getAllMetadata();
      set({ savedConversations: metadata });
    } catch (error) {
      console.error('Failed to auto-save conversation:', error);
    }
  },
});

// Made with Bob