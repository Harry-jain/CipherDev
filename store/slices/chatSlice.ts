import { StateCreator } from 'zustand';
import { ChatState, ChatMessage } from '../types';

export const createChatSlice: StateCreator<ChatState> = (set) => ({
  messages: [],
  isGenerating: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        },
      ],
    })),

  updateLastMessage: (content, partial = false) =>
    set((state) => {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];

      if (lastMessage && lastMessage.role === 'assistant') {
        if (partial) {
          // Append to existing content for streaming
          lastMessage.content += content;
        } else {
          // Replace content completely
          lastMessage.content = content;
        }
      }

      return { messages };
    }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  clearHistory: () => set({ messages: [], isGenerating: false }),
});

// Made with Bob
