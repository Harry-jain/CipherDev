'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { ChatMessage } from '@/store/types';
import { importConversationFromFile } from '@/features/conversation/importJson';
import { Button } from '@/components/ui/button';

interface ImportChatButtonProps {
  onImport: (messages: ChatMessage[]) => void;
  onError: (error: string) => void;
}

export function ImportChatButton({ onImport, onError }: ImportChatButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const messages = await importConversationFromFile(file);
      onImport(messages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import conversation';
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="relative flex items-center justify-center my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-800"></div>
        </div>
        <div className="relative px-4 bg-black">
          <span className="text-sm text-gray-500">or</span>
        </div>
      </div>

      {/* Prompt and Button */}
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-400">
          Would you like to restore a previous chat?
        </p>
        
        <Button
          onClick={handleButtonClick}
          disabled={isProcessing}
          variant="secondary"
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Import from JSON
            </>
          )}
        </Button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Import conversation from JSON file"
        />
      </div>
    </div>
  );
}

// Made with Bob