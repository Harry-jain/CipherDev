import { Trash2 } from 'lucide-react';
import { ConversationMetadata } from '../types';
import { formatRelativeTime } from '../utils';
import { cn } from '@/lib/utils';

interface ConversationCardProps {
  conversation: ConversationMetadata;
  isActive: boolean;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationCard({
  conversation,
  isActive,
  onLoad,
  onDelete,
}: ConversationCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${conversation.title}"?`)) {
      onDelete(conversation.id);
    }
  };

  return (
    <div
      onClick={() => onLoad(conversation.id)}
      className={cn(
        'group relative p-3 rounded-lg cursor-pointer transition-all',
        'hover:bg-gray-800/50 border',
        isActive
          ? 'bg-blue-600/20 border-blue-600/30'
          : 'bg-gray-800/30 border-gray-700/30 hover:border-gray-600/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={cn(
              'text-sm font-medium truncate',
              isActive ? 'text-blue-400' : 'text-gray-100'
            )}
          >
            {conversation.title}
          </h3>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{conversation.messageCount} msgs</span>
            <span>•</span>
            <span>{formatRelativeTime(conversation.updatedAt)}</span>
          </div>
        </div>

        {/* Delete button - shows on hover */}
        <button
          onClick={handleDelete}
          className={cn(
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400'
          )}
          aria-label="Delete conversation"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r" />
      )}
    </div>
  );
}

// Made with Bob