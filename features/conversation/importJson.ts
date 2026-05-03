import { ChatMessage } from '@/store/types';

/**
 * Structure of exported conversation JSON
 */
export interface ExportedConversation {
  exportDate: string;
  model: string;
  messageCount: number;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    tokens?: number;
    speed?: number;
  }>;
}

/**
 * Validate that the imported JSON has the correct structure
 */
export function validateImportedJson(data: any): boolean {
  // Check if data exists
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check if messages array exists
  if (!Array.isArray(data.messages)) {
    return false;
  }

  // Check if messages array is not empty
  if (data.messages.length === 0) {
    return false;
  }

  // Validate each message has required fields
  for (const message of data.messages) {
    if (!message.role || !message.content || !message.timestamp) {
      return false;
    }

    // Validate role is one of the allowed values
    if (!['user', 'assistant', 'system'].includes(message.role)) {
      return false;
    }

    // Validate content is a string
    if (typeof message.content !== 'string' || message.content.trim() === '') {
      return false;
    }

    // Validate timestamp is a number
    if (typeof message.timestamp !== 'number') {
      return false;
    }
  }

  return true;
}

/**
 * Parse imported conversation and convert to ChatMessage array
 */
export function parseImportedConversation(data: ExportedConversation): ChatMessage[] {
  return data.messages.map((msg) => ({
    id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    tokens: msg.tokens,
    speed: msg.speed,
  }));
}

/**
 * Main function to import conversation from a JSON file
 */
export async function importConversationFromFile(file: File): Promise<ChatMessage[]> {
  // Validate file type
  if (!file.name.endsWith('.json')) {
    throw new Error('Please select a JSON file');
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File is too large. Maximum size is 10MB');
  }

  // Read file content
  const text = await file.text();

  // Parse JSON
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error('Invalid JSON file format. Please check the file and try again');
  }

  // Validate structure
  if (!validateImportedJson(data)) {
    throw new Error(
      'Invalid conversation format. Please ensure you are importing a file exported from CipherDev'
    );
  }

  // Parse and return messages
  return parseImportedConversation(data as ExportedConversation);
}

// Made with Bob