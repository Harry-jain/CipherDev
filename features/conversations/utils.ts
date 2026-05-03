import { ChatMessage } from '@/store/types';
import { ConversationMetadata, SavedConversation } from './types';

/**
 * Generate a conversation title from messages
 * Uses first user message or falls back to timestamp
 */
export function generateConversationTitle(messages: ChatMessage[]): string {
  // Find first user message
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  
  if (!firstUserMessage) {
    return `Conversation ${new Date().toLocaleDateString()}`;
  }

  // Take first 50 characters and clean up
  let title = firstUserMessage.content.trim().slice(0, 50);
  
  // Remove newlines and extra spaces
  title = title.replace(/\s+/g, ' ');
  
  // Add ellipsis if truncated
  if (firstUserMessage.content.length > 50) {
    title += '...';
  }

  return title || `Conversation ${new Date().toLocaleDateString()}`;
}

/**
 * Generate preview text from first user message
 */
export function generatePreview(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  
  if (!firstUserMessage) {
    return 'No messages yet';
  }

  // Take first 100 characters
  let preview = firstUserMessage.content.trim().slice(0, 100);
  
  // Remove newlines and extra spaces
  preview = preview.replace(/\s+/g, ' ');
  
  // Add ellipsis if truncated
  if (firstUserMessage.content.length > 100) {
    preview += '...';
  }

  return preview;
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

/**
 * Search in conversation content
 */
export function searchInConversation(
  conversation: SavedConversation,
  query: string
): boolean {
  if (!query.trim()) return true;

  const lowerQuery = query.toLowerCase();
  
  // Search in title
  if (conversation.metadata.title.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  // Search in preview
  if (conversation.metadata.preview.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  // Search in message content
  return conversation.messages.some(msg =>
    msg.content.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Sort conversations by different criteria
 */
export function sortConversations(
  conversations: ConversationMetadata[],
  sortBy: 'date' | 'title' | 'messageCount' = 'date',
  order: 'asc' | 'desc' = 'desc'
): ConversationMetadata[] {
  const sorted = [...conversations];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = a.updatedAt - b.updatedAt;
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'messageCount':
        comparison = a.messageCount - b.messageCount;
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Generate unique conversation ID
 */
export function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate conversation data
 */
export function isValidConversation(conversation: SavedConversation): boolean {
  return !!(
    conversation.id &&
    conversation.metadata &&
    conversation.messages &&
    Array.isArray(conversation.messages)
  );
}

// Made with Bob