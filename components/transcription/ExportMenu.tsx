'use client';

import { useState } from 'react';
import { Download, FileText, Code2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TranscriptionExport, ExportFormat } from '@/features/transcription/types';
import { exportTranscription } from '@/features/transcription/exportTranscription';
import { cn } from '@/lib/utils';

interface ExportMenuProps {
  data: TranscriptionExport;
  disabled?: boolean;
  className?: string;
}

/**
 * Export menu with format options
 * Allows exporting transcription as Markdown or JSON
 */
export function ExportMenu({ data, disabled = false, className }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exported, setExported] = useState<ExportFormat | null>(null);

  const handleExport = (format: ExportFormat) => {
    try {
      exportTranscription(data, format);
      setExported(format);
      setTimeout(() => {
        setExported(null);
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Main Export Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        size="lg"
        className="w-full"
      >
        <Download className="h-5 w-5 mr-2" />
        Export Transcription
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden">
            {/* Markdown Option */}
            <button
              onClick={() => handleExport('markdown')}
              disabled={disabled}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3',
                'text-left transition-colors',
                'hover:bg-gray-800/50',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <div className="flex-shrink-0 p-2 bg-blue-600/20 rounded-lg">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-100">Markdown</span>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                    .md
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Human-readable format with summary first
                </p>
              </div>
              {exported === 'markdown' && (
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
              )}
            </button>

            {/* JSON Option */}
            <button
              onClick={() => handleExport('json')}
              disabled={disabled}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3',
                'text-left transition-colors',
                'hover:bg-gray-800/50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'border-t border-gray-800/50'
              )}
            >
              <div className="flex-shrink-0 p-2 bg-purple-600/20 rounded-lg">
                <Code2 className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-100">JSON</span>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                    .json
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Structured data with full metadata
                </p>
              </div>
              {exported === 'json' && (
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Made with Bob