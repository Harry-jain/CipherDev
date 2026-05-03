import { ChatMessage } from '@/store/types';

/**
 * Export chat conversation as a text file
 * Creates a local Blob URL for download - no external transmission
 */
export function exportConversationAsTxt(messages: ChatMessage[], modelName?: string): void {
  // Build the text content
  const header = `CipherDev Conversation Export
Generated: ${new Date().toLocaleString()}
Model: ${modelName || 'Unknown'}
Total Messages: ${messages.length}
${'='.repeat(80)}

`;

  const content = messages
    .map((msg) => {
      const role = msg.role.toUpperCase();
      const timestamp = new Date(msg.timestamp).toLocaleString();
      const tokens = msg.tokens ? ` (${msg.tokens} tokens)` : '';
      const speed = msg.speed ? ` @ ${msg.speed.toFixed(1)} tok/s` : '';
      
      let text = `[${role}] ${timestamp}${tokens}${speed}\n`;
      text += `${msg.content}\n`;
      text += '\n' + '-'.repeat(80) + '\n\n';
      
      return text;
    })
    .join('');

  const footer = `${'='.repeat(80)}
End of Conversation
Exported from CipherDev - Privacy-First AI Chat
All processing done locally in your browser
`;

  const fullContent = header + content + footer;

  // Create blob and download
  const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `chipherdev-chat-${Date.now()}.txt`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the blob URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export conversation as JSON for programmatic use
 */
export function exportConversationAsJson(messages: ChatMessage[], modelName?: string): void {
  const data = {
    exportDate: new Date().toISOString(),
    model: modelName || 'Unknown',
    messageCount: messages.length,
    messages: messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      tokens: msg.tokens,
      speed: msg.speed,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `chipherdev-chat-${Date.now()}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Made with Bob
