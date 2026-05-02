'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Download, Trash2, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getEngine } from '@/features/llm/engineFactory';
import { exportConversationAsTxt } from '@/features/conversation/exportTxt';
import { MODEL_REGISTRY } from '@/features/llm/modelRegistry';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

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
  } = useAppStore();

  const [input, setInput] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
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

    return `You are Solvley, an AI-powered risk detection and task execution system.
Runtime context:
- Current local datetime: ${datetime}
- Loaded model: ${loadedModel?.name || 'unknown'} (${backend})

Core idea:
- You take user data (location, health, environment)
- Determine the risk level (low, medium, high)
- If risk is high, recommend real-world tasks (e.g., send medical kit, rescue)

Return ONLY clean JSON responses in this format:
{ "risk": "low|medium|high", "action": "none|medical_kit|rescue" }

To ensure the UI renders correctly, wrap your JSON output in <answer> tags like this:
<answer>
{
  "risk": "high",
  "action": "rescue"
}
</answer>

Do not include any other markdown formatting outside of the <answer> tags.
If you need to reason about the decision, use <reasoning> tags BEFORE the <answer> tags.`;
  };

  const parseResponse = (content: string) => {
    const answerMatch = content.match(/<answer>([\s\S]*?)<\/answer>/);
    const reasoningMatch = content.match(/<reasoning>([\s\S]*?)<\/reasoning>/);

    return {
      answer: answerMatch ? answerMatch[1].trim() : content,
      reasoning: reasoningMatch ? reasoningMatch[1].trim() : undefined,
    };
  };

  const handleQuickReply = (type: string) => {
    const replies: Record<string, string> = {
      greeting: 'Hello! How can I help you today?',
      model: `I am running ${loadedModel?.name || 'an AI model'} via ${backend} acceleration, entirely in your browser.`,
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

    // Check for quick replies
    const lowerInput = userMessage.toLowerCase();
    if (lowerInput.match(/^(hi|hello|hey)$/)) {
      handleQuickReply('greeting');
      setGenerating(false);
      return;
    }
    if (lowerInput.includes('what model') || lowerInput.includes('which model')) {
      handleQuickReply('model');
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

      // Parse reasoning and answer
      const parsed = parseResponse(fullResponse);
      
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
            reasoning: parsed.reasoning,
          };
        }
        return { messages: newMessages };
      });
      
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
    <div className="flex flex-col h-screen">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6">
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
            </div>
          ) : (
            messages.map((message, index) => {
              const parsed = message.role === 'assistant' ? parseResponse(message.content) : null;

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

                    {message.role === 'assistant' && parsed?.reasoning && (
                      <details className="mb-2">
                        <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                          Show reasoning
                        </summary>
                        <div className="mt-2 p-3 bg-gray-800/50 rounded text-sm text-gray-300 markdown-content">
                          {parsed.reasoning}
                        </div>
                      </details>
                    )}

                    <div
                      className={`text-gray-100 markdown-content ${
                        isGenerating && index === messages.length - 1 ? 'streaming-cursor' : ''
                      }`}
                    >
                      {parsed ? parsed.answer : message.content}
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
      <div className="border-t border-gray-800/50 bg-gray-900/50 backdrop-blur-sm p-4">
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
    </div>
  );
}

// Made with Bob
