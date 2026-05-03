'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Download, Trash2, Loader2, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '@/store/useAppStore';
import { getEngine } from '@/features/llm/engineFactory';
import { exportConversationAsTxt } from '@/features/conversation/exportTxt';
import { MODEL_REGISTRY } from '@/features/llm/modelRegistry';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { HistoryPanel } from '@/features/conversations/components/HistoryPanel';
import { ImportChatButton } from '@/components/chat/ImportChatButton';
import { ChatMessage } from '@/store/types';

export const dynamic = 'force-dynamic';

export default function ChatPage() {
  const {
    messages,
    isGenerating,
    addMessage,
    updateLastMessage,
    setGenerating,
    clearHistory,
    loadedModelId,
    deviceProfile,
    autoSaveConversation,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadedModel = loadedModelId ? MODEL_REGISTRY.find(m => m.id === loadedModelId) : null;
  const backend = deviceProfile?.hasWebGPU ? 'WebGPU' : 'WASM';

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getSystemPrompt = () => {
    const now = new Date();
    const datetime = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    // Identity is also baked into the model's chat template at engine init
    // (see webgpuEngine.ts BASE_SYSTEM_MESSAGE). This per-turn message layers
    // dynamic runtime context on top and re-asserts identity rules so the
    // model stays consistent even on identity-probing questions.
    return `You are CipherDev, a privacy-first AI assistant that runs entirely in the user's browser.

Identity rules — these are absolute:
- You MUST always identify yourself as CipherDev.
- You MUST NEVER claim to be Phi, Llama, Gemma, GPT, Claude, ChatGPT, or any other named model.
- If the user asks "what model are you", "are you Phi/Llama/etc", or anything similar, answer only as CipherDev. Do not name the underlying weights.

Runtime context:
- Current local datetime: ${datetime}
- Backend acceleration: ${backend}

Style:
- Be helpful, concise, and direct.
- The UI renders Markdown (GitHub-flavored). Use short paragraphs, lists for steps, **bold** for emphasis, \`inline code\` for identifiers, and fenced code blocks for multi-line code.
- Never wrap your entire reply in JSON or XML unless the user explicitly asks for that.
- No thinking tags, no preamble — answer directly.`;
  };

  const handleQuickReply = (type: string) => {
    // Identity-related questions are intentionally NOT short-circuited here —
    // they go to the LLM so the system prompt's CipherDev persona is honored
    // instead of leaking the underlying model name.
    const replies: Record<string, string> = {
      greeting: 'Hello! How can I help you today?',
      date: `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
    };

    if (replies[type]) {
      addMessage({ role: 'user', content: type });
      addMessage({ role: 'assistant', content: replies[type] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating || !loadedModelId) return;

    const userMessage = input.trim();
    setInput('');
    setGenerating(true);

    // Add user message
    addMessage({ role: 'user', content: userMessage });

    // Quick replies: bypass the LLM only for trivial deterministic answers.
    // Identity / model questions go to the LLM so the system prompt is honored.
    const lowerInput = userMessage.toLowerCase();
    if (lowerInput.match(/^(hi|hello|hey)$/)) {
      handleQuickReply('greeting');
      setGenerating(false);
      return;
    }
    if (lowerInput.includes('what') && (lowerInput.includes('date') || lowerInput.includes('today'))) {
      handleQuickReply('date');
      setGenerating(false);
      return;
    }

    try {
      // Get engine
      const engine = await getEngine(deviceProfile?.hasWebGPU || false);

      // Use default settings
      const temperature = 0.7;
      const maxTokens = 2048;

      // Prepare messages with system prompt
      const systemPrompt = getSystemPrompt();
      const conversationMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
      ];

      // Add empty assistant message
      addMessage({ role: 'assistant', content: '' });

      // Generate response with streaming and token speed tracking
      let fullResponse = '';
      let currentSpeed = 0;
      let lastUIUpdateTime = Date.now();

      await engine.generate(
        conversationMessages,
        (chunk: string, tokenSpeed?: number) => {
          fullResponse += chunk;
          if (tokenSpeed !== undefined && tokenSpeed > 0) {
            currentSpeed = tokenSpeed;
          }
          
          // Throttle UI updates to 15 frames per second (~66ms) to prevent freezing
          const now = Date.now();
          if (now - lastUIUpdateTime > 66) {
            updateLastMessage(fullResponse, false);
            lastUIUpdateTime = now;
          }
        },
        { temperature, maxTokens }
      );
      
      // Ensure the final state is updated
      updateLastMessage(fullResponse, false);

      // Calculate final token count
      const tokens = fullResponse.split(/\s+/).length;

      // Update final message with metadata
      useAppStore.setState((state) => {
        const newMessages = [...state.messages];
        const actualLastIndex = newMessages.length - 1;
        if (newMessages[actualLastIndex] && newMessages[actualLastIndex].role === 'assistant') {
          newMessages[actualLastIndex] = {
            ...newMessages[actualLastIndex],
            content: fullResponse,
            tokens,
            speed: currentSpeed,
          };
        }
        return { messages: newMessages };
      });

      // Auto-save conversation after successful generation
      await autoSaveConversation();
      
    } catch (error) {
      console.error('Generation error:', error);
      addMessage({
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to generate response'}`,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    if (loadedModel) {
      exportConversationAsTxt(messages, loadedModel.name);
    }
    setShowEndModal(false);
  };

  const handleDelete = () => {
    clearHistory();
    setShowEndModal(false);
  };

  const handleImportChat = async (importedMessages: ChatMessage[]) => {
    try {
      // Clear current chat
      clearHistory();
      
      // Add imported messages
      importedMessages.forEach(msg => {
        addMessage(msg);
      });
      
      // Auto-save the imported conversation
      await autoSaveConversation();
      
      // Clear any previous errors
      setImportError(null);
    } catch (error) {
      console.error('Failed to import chat:', error);
      setImportError('Failed to load imported conversation');
    }
  };

  const handleImportError = (error: string) => {
    setImportError(error);
    // Clear error after 5 seconds
    setTimeout(() => setImportError(null), 5000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!loadedModelId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-100">No Model Loaded</h2>
          <p className="text-gray-400">Please load a model first to start chatting.</p>
          <Button onClick={() => window.location.href = '/models'}>
            Go to Models
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Floating History Button - Top Right (below topbar) */}
      <button
        onClick={() => setShowHistoryPanel(true)}
        className="fixed top-20 right-6 md:right-8 z-30 p-3 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/50 rounded-lg backdrop-blur-sm transition-all hover:scale-105 shadow-lg"
        aria-label="Open conversation history"
      >
        <Clock className="h-5 w-5 text-gray-300" />
      </button>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center space-y-6 py-12">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-100">Start a Conversation</h2>
                <p className="text-gray-400">
                  Ask me anything. All processing happens locally in your browser.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setInput('What can you help me with?')}
                  className="p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg text-left transition-colors"
                >
                  <p className="text-sm text-gray-300">What can you help me with?</p>
                </button>
                <button
                  onClick={() => setInput('Explain quantum computing in simple terms')}
                  className="p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg text-left transition-colors"
                >
                  <p className="text-sm text-gray-300">Explain quantum computing</p>
                </button>
                <button
                  onClick={() => setInput('Write a haiku about privacy')}
                  className="p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg text-left transition-colors"
                >
                  <p className="text-sm text-gray-300">Write a haiku about privacy</p>
                </button>
              </div>

              {/* Import Chat Button */}
              <ImportChatButton
                onImport={handleImportChat}
                onError={handleImportError}
              />

              {/* Error Message */}
              {importError && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
                  <p className="text-sm text-red-400 text-center">{importError}</p>
                </div>
              )}
            </div>
          ) : (
            messages.map((message, index) => {
              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] space-y-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600/20 border border-blue-600/30 rounded-lg p-4'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-400">
                        {message.role === 'user' ? 'You' : 'CipherDev'}
                      </span>
                      {message.tokens && (
                        <Badge variant="default" className="text-xs">
                          {message.tokens} tokens
                        </Badge>
                      )}
                      {message.speed && (
                        <Badge variant="info" className="text-xs">
                          {message.speed.toFixed(1)} t/s
                        </Badge>
                      )}
                    </div>

                    <div
                      className={`text-gray-100 markdown-content ${
                        isGenerating && index === messages.length - 1 ? 'streaming-cursor' : ''
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <span className="whitespace-pre-wrap">{message.content}</span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift+Enter for new line)"
              disabled={isGenerating}
              rows={1}
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none custom-scrollbar"
              style={{ minHeight: '48px', maxHeight: '200px' }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="px-6"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>

          {messages.length > 0 && (
            <div className="flex justify-center mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEndModal(true)}
                className="text-gray-400 hover:text-gray-300"
              >
                End Session
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* End Session Modal */}
      <Modal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="End Session"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEndModal(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export & Keep
            </Button>
            <Button variant="danger" onClick={handleDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete & Exit
            </Button>
          </>
        }
      >
        <p className="text-gray-300">
          What would you like to do with this conversation?
        </p>
      </Modal>

      {/* History Panel */}
      <HistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
      />
    </div>
  );
}

// Made with Bob
