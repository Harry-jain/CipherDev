import { SavedConversation, ConversationMetadata } from './types';

/**
 * IndexedDB wrapper for conversation storage
 * Provides CRUD operations for conversations
 * All data stays local - no external transmission
 */
class ConversationStorage {
  private dbName = 'chipherdev-conversations';
  private storeName = 'conversations';
  private version = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
          
          // Create indexes for efficient querying
          objectStore.createIndex('updatedAt', 'metadata.updatedAt', { unique: false });
          objectStore.createIndex('modelId', 'metadata.modelId', { unique: false });
          objectStore.createIndex('title', 'metadata.title', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Save or update a conversation
   */
  async saveConversation(conversation: SavedConversation): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(conversation);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save conversation'));
    });
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(id: string): Promise<SavedConversation | null> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Failed to get conversation'));
    });
  }

  /**
   * Get all conversation metadata (lightweight)
   */
  async getAllMetadata(): Promise<ConversationMetadata[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const conversations = request.result as SavedConversation[];
        const metadata = conversations.map(conv => conv.metadata);
        
        // Sort by most recent first
        metadata.sort((a, b) => b.updatedAt - a.updatedAt);
        
        resolve(metadata);
      };
      request.onerror = () => reject(new Error('Failed to get conversations'));
    });
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete conversation'));
    });
  }

  /**
   * Update conversation metadata only
   */
  async updateMetadata(id: string, updates: Partial<ConversationMetadata>): Promise<void> {
    const conversation = await this.getConversation(id);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.metadata = {
      ...conversation.metadata,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.saveConversation(conversation);
  }

  /**
   * Search conversations by title or content
   */
  async searchConversations(query: string): Promise<ConversationMetadata[]> {
    const allMetadata = await this.getAllMetadata();
    
    if (!query.trim()) {
      return allMetadata;
    }

    const lowerQuery = query.toLowerCase();
    
    return allMetadata.filter(metadata => 
      metadata.title.toLowerCase().includes(lowerQuery) ||
      metadata.preview.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Clear all conversations (for settings)
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear conversations'));
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{ count: number; estimatedSize: number }> {
    const metadata = await this.getAllMetadata();
    
    // Rough estimate: each message ~500 bytes
    const estimatedSize = metadata.reduce((total, conv) => {
      return total + (conv.messageCount * 500);
    }, 0);

    return {
      count: metadata.length,
      estimatedSize,
    };
  }
}

// Export singleton instance
export const conversationStorage = new ConversationStorage();

// Made with Bob