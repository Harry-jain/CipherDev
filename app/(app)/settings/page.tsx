'use client';

import { useState } from 'react';
import { Trash2, Download, RefreshCw, Info, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { exportConversationAsTxt, exportConversationAsJson } from '@/features/conversation/exportTxt';
import { resetEngine } from '@/features/llm/engineFactory';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const { messages, clearHistory, loadedModelId, setLoadedModel, setModelStatus } = useAppStore();
  const [showClearModal, setShowClearModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // Generation settings (stored in localStorage)
  const [temperature, setTemperature] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseFloat(localStorage.getItem('chipherdev-temperature') || '0.7');
    }
    return 0.7;
  });
  
  const [maxTokens, setMaxTokens] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('chipherdev-max-tokens') || '2048');
    }
    return 2048;
  });
  
  const [showReasoning, setShowReasoning] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chipherdev-show-reasoning') !== 'false';
    }
    return true;
  });
  
  const handleTemperatureChange = (value: number) => {
    setTemperature(value);
    localStorage.setItem('chipherdev-temperature', value.toString());
  };
  
  const handleMaxTokensChange = (value: number) => {
    setMaxTokens(value);
    localStorage.setItem('chipherdev-max-tokens', value.toString());
  };
  
  const handleShowReasoningChange = (value: boolean) => {
    setShowReasoning(value);
    localStorage.setItem('chipherdev-show-reasoning', value.toString());
  };

  const handleClearHistory = () => {
    clearHistory();
    setShowClearModal(false);
  };

  const handleExportTxt = () => {
    if (messages.length > 0) {
      exportConversationAsTxt(messages, loadedModelId || undefined);
    }
  };

  const handleExportJson = () => {
    if (messages.length > 0) {
      exportConversationAsJson(messages, loadedModelId || undefined);
    }
  };

  const handleResetCache = () => {
    resetEngine();
    setModelStatus('idle');
    setShowResetModal(false);
    
    // Clear IndexedDB cache (browser-specific)
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
          <p className="text-gray-400">
            Manage your CipherDev preferences and data
          </p>
        </div>

        {/* Conversation Management */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-100">Conversation Management</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-100">Export as Text</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Download your conversation history as a readable text file
                </p>
              </div>
              <Button
                onClick={handleExportTxt}
                disabled={messages.length === 0}
                variant="secondary"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export TXT
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-100">Export as JSON</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Download your conversation in JSON format for programmatic use
                </p>
              </div>
              <Button
                onClick={handleExportJson}
                disabled={messages.length === 0}
                variant="secondary"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-900/20 border border-red-800/30 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-100">Clear Chat History</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Permanently delete all messages from this session
                </p>
              </div>
              <Button
                onClick={() => setShowClearModal(true)}
                disabled={messages.length === 0}
                variant="danger"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </Card>

        {/* Generation Settings */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-100">Generation Settings</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-100">
                  Temperature: {temperature.toFixed(2)}
                </label>
                <span className="text-xs text-gray-500">Controls randomness</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <p className="text-xs text-gray-500">
                Lower values make output more focused and deterministic. Higher values make it more creative.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-100">
                  Max Tokens: {maxTokens}
                </label>
                <span className="text-xs text-gray-500">Response length limit</span>
              </div>
              <input
                type="range"
                min="256"
                max="4096"
                step="256"
                value={maxTokens}
                onChange={(e) => handleMaxTokensChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <p className="text-xs text-gray-500">
                Maximum number of tokens the model can generate in a single response.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-100">Show Reasoning</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Display Claude-style reasoning process before answers
                </p>
              </div>
              <button
                onClick={() => handleShowReasoningChange(!showReasoning)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showReasoning ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showReasoning ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Model Management */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-100">Model Management</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-100">Current Model</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {loadedModelId || 'No model loaded'}
                </p>
              </div>
              <Button
                onClick={() => window.location.href = '/models'}
                variant="secondary"
              >
                Change Model
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-100">Reset Model Cache</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Clear cached models and force re-download on next load
                </p>
              </div>
              <Button
                onClick={() => setShowResetModal(true)}
                variant="secondary"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Cache
              </Button>
            </div>
          </div>
        </Card>

        {/* Privacy Information */}
        <Card className="p-6 space-y-4 bg-blue-900/20 border-blue-800/50">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-100 mb-2">Privacy Notice</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                All your data is stored locally in your browser. CipherDev never sends your
                conversations, messages, or personal information to any external server. Model
                weights are downloaded from HuggingFace and cached locally for faster loading.
              </p>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-100">About CipherDev</h2>
          
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-gray-300">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Framework</span>
              <span className="text-gray-300">Next.js 14</span>
            </div>
            <div className="flex justify-between">
              <span>LLM Engine</span>
              <span className="text-gray-300">@mlc-ai/web-llm + @xenova/transformers</span>
            </div>
            <div className="flex justify-between">
              <span>Privacy Audit</span>
              <span className="text-gray-300">IBM Bob Certified</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800/50">
            <p className="text-xs text-gray-500 text-center">
              Made with ❤️ and IBM Bob 🤖🔒
            </p>
          </div>
        </Card>
      </div>

      {/* Clear History Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Chat History"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowClearModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearHistory} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear History
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">
              This will permanently delete all {messages.length} message(s) from your current
              session. This action cannot be undone.
            </p>
          </div>
          <p className="text-sm text-gray-400">
            Consider exporting your conversation before clearing if you want to keep a copy.
          </p>
        </div>
      </Modal>

      {/* Reset Cache Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Model Cache"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleResetCache} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reset Cache
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-300">
            This will clear all cached model data from your browser. You'll need to re-download
            models the next time you load them.
          </p>
          <div className="flex items-start gap-3 p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">
              This may free up several gigabytes of storage space but will require re-downloading
              models over the network.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Made with Bob
