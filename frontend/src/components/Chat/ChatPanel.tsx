import { useState, useRef, useEffect } from 'react';
import { useChatWithGemini } from '../../hooks/useChatWithGemini';

interface ChatPanelProps {
  projectId: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage } = useChatWithGemini(projectId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    sendMessage(message);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">ArchCoach Chat</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Start chatting with ArchCoach to modify your diagram.</p>
            <p className="text-sm mt-2">Example: "Add a database node"</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {message.role === 'user' ? 'You' : 'ArchCoach'}
              </div>
              <div className="text-sm break-words whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="text-sm text-gray-600">Thinking...</div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask ArchCoach to modify your diagram..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}



