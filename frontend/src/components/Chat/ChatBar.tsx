import { useState, useRef, useEffect } from 'react';
import { useChatWithGemini } from '../../hooks/useChatWithGemini';
import { FaChevronUp, FaChevronDown, FaPaperPlane, FaComment } from 'react-icons/fa';

interface ChatBarProps {
  projectId: string | null;
  leftSidebarCollapsed?: boolean;
}

export function ChatBar({ projectId, leftSidebarCollapsed = false }: ChatBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);

  // Calculate left margin based on sidebar state
  // Left sidebar: 256px (w-64) when expanded, 0 when collapsed
  const leftSidebarWidth = leftSidebarCollapsed ? 0 : 256;
  
  // ReactFlow controls positioning
  // MiniMap: ~200px wide, positioned bottom-right
  // Zoom Controls: ~50px wide, positioned above minimap
  // Total space needed on right: ~260px
  const rightControlsWidth = 260;

  // Handle window resize to keep chat bar centered
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Only initialize chat if projectId is available
  // Use dummy projectId to prevent hook errors, but disable functionality
  const { messages, isLoading, sendMessage } = useChatWithGemini(projectId || 'dummy');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
    }
  }, [messages, isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !projectId) return;
    const message = input.trim();
    setInput('');
    sendMessage(message);
    // Auto-expand when sending a message
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    } else if (e.key === 'Escape' && isExpanded) {
      setIsExpanded(false);
    }
  };

  // Show chat bar always, but disable if no projectId
  const isDisabled = !projectId;

  // Calculate chat bar width and position, shifted to the right
  const availableWidth = windowWidth;
  const minSpacing = 20; // Minimum spacing on each side
  const minChatBarWidth = 400; // Minimum chat bar width
  const rightShift = 100; // Shift chat bar to the right by this amount
  
  // Calculate total available space (excluding sidebars and controls)
  const totalAvailableSpace = availableWidth - leftSidebarWidth - rightControlsWidth;
  
  // Position chat bar shifted to the right
  // Increase left spacing to shift it right, maintain minimum right spacing
  const leftSpacing = minSpacing + rightShift;
  const rightSpacing = minSpacing;
  const chatBarWidth = Math.max(minChatBarWidth, totalAvailableSpace - leftSpacing - rightSpacing);
  const chatBarLeft = leftSidebarWidth + leftSpacing;
  
  return (
    <div
      className={`
        fixed bottom-0 z-40
        bg-white border-t border-gray-300 shadow-lg
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'h-[300px]' : 'h-[60px]'}
      `}
      style={{
        left: `${chatBarLeft}px`,
        width: `${chatBarWidth}px`,
      }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <FaComment className="text-blue-600" />
          <span className="text-sm font-semibold text-gray-800">ArchCoach</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          aria-label={isExpanded ? 'Minimize chat' : 'Expand chat'}
        >
          {isExpanded ? (
            <FaChevronDown className="text-gray-600" />
          ) : (
            <FaChevronUp className="text-gray-600" />
          )}
        </button>
      </div>

      {/* Messages Area (only visible when expanded) */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[200px] bg-white">
          {isDisabled ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ Supabase Configuration Required</p>
                <p className="text-xs text-yellow-700">
                  The chat feature requires Supabase to be configured. Please set up your Supabase credentials in <code className="bg-yellow-100 px-1 rounded">frontend/.env</code>.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  See <code className="bg-yellow-100 px-1 rounded">SETUP_GUIDE.md</code> for instructions.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <p className="text-sm">Start chatting with ArchCoach to modify your diagram.</p>
                  <p className="text-xs mt-2 text-gray-400">Example: "Add a database node"</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="text-xs font-medium mb-1 opacity-75">
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
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="text-xs text-gray-600 ml-2">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className={`px-4 py-2 border-t border-gray-200 bg-white ${
          isExpanded ? '' : 'flex items-center gap-2'
        }`}
      >
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isDisabled
                ? "Configure Supabase to enable chat..."
                : isExpanded
                ? "Ask ArchCoach to modify your diagram..."
                : "Type a message..."
            }
            disabled={isLoading || isDisabled}
            className={`
              flex-1 px-3 py-2 border border-gray-300 rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              text-sm
              ${!isExpanded ? 'flex-1' : 'w-full'}
            `}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || isDisabled}
            className={`
              px-4 py-2 bg-blue-600 text-white rounded-md
              hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors flex items-center gap-2
              ${!isExpanded ? 'flex-shrink-0' : ''}
            `}
            aria-label="Send message"
          >
            {isExpanded ? (
              <>
                <span className="text-sm">Send</span>
                <FaPaperPlane className="text-xs" />
              </>
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

