'use client';

import { useEffect, useState } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ConversationCard } from './ConversationCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
  const {
    savedConversations,
    currentConversationId,
    loadConversationsList,
    loadConversation,
    deleteConversation,
    createNewConversation,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState(savedConversations);

  // Load conversations when panel opens
  useEffect(() => {
    if (isOpen) {
      loadConversationsList();
    }
  }, [isOpen, loadConversationsList]);

  // Filter conversations based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(savedConversations);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = savedConversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(lowerQuery) ||
        conv.preview.toLowerCase().includes(lowerQuery)
    );
    setFilteredConversations(filtered);
  }, [searchQuery, savedConversations]);

  const handleLoad = async (id: string) => {
    await loadConversation(id);
    onClose(); // Close panel after loading
  };

  const handleNewChat = () => {
    createNewConversation();
    onClose();
  };

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
          onClick={onClose}
        />
      )}

      {/* Slide-in Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-screen w-80 md:w-96',
          'bg-gray-900/95 border-l border-gray-800/50 backdrop-blur-sm',
          'transition-transform duration-300 z-50',
          'flex flex-col shadow-2xl',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-100">
              Conversation History
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-100 transition-colors p-1 rounded hover:bg-gray-800"
              aria-label="Close history panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-800/50">
          <Button
            onClick={handleNewChat}
            className="w-full gap-2"
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </Button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-3">
                <div className="w-16 h-16 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-gray-600" />
                </div>
              </div>
              <p className="text-gray-500 text-sm">
                {searchQuery
                  ? 'No conversations found'
                  : 'No saved conversations yet'}
              </p>
              {!searchQuery && (
                <p className="text-gray-600 text-xs mt-2">
                  Start chatting and your conversation will be automatically saved
                </p>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                isActive={conv.id === currentConversationId}
                onLoad={handleLoad}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800/50">
          <p className="text-xs text-gray-500 text-center">
            {savedConversations.length} conversation{savedConversations.length !== 1 ? 's' : ''} saved locally
          </p>
        </div>
      </div>
    </>
  );
}

// Made with Bob