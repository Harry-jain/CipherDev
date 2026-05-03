import { ChatMessage } from '@/store/types';

/**
 * Conversation metadata for listing and searching
 * Stored separately from full conversation for performance
 */
export interface ConversationMetadata {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  modelId: string;
  preview: string; // First 100 chars of first user message
  tags?: string[];
}

/**
 * Full conversation with all messages
 * Stored in IndexedDB
 */
export interface SavedConversation {
  id: string;
  metadata: ConversationMetadata;
  messages: ChatMessage[];
}

/**
 * Filters for searching and sorting conversations
 */
export interface ConversationFilters {
  searchQuery?: string;
  modelId?: string;
  sortBy?: 'date' | 'title' | 'messageCount';
  sortOrder?: 'asc' | 'desc';
}

// Made with Bob