import { useState, useRef, useEffect } from 'react';
import { useChatWithGemini } from '../../hooks/useChatWithGemini';
import { isSupabaseAvailable } from '../../lib/supabaseClient';
import { FaChevronUp, FaChevronDown, FaPaperPlane } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ChatBarProps {
  projectId: string | null;
  leftSidebarCollapsed?: boolean;
}

export function ChatBar({ projectId, leftSidebarCollapsed = false }: ChatBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);

  // Calculate left margin based on sidebar state
  const leftSidebarWidth = leftSidebarCollapsed ? 0 : 256;
  const rightControlsWidth = 260;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Only initialize chat if projectId is available
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
    if (!isExpanded) {
      setIsExpanded(true);
    }
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    } else if (e.key === 'Escape' && isExpanded) {
      setIsExpanded(false);
    }
  };

  const isSupabaseConfigured = isSupabaseAvailable();
  const isDisabled = !isSupabaseConfigured;

  // Calculate chat bar width and position
  const availableWidth = windowWidth;
  const minSpacing = 20;
  const minChatBarWidth = 400;
  const rightShift = 100;
  
  const totalAvailableSpace = availableWidth - leftSidebarWidth - rightControlsWidth;
  const leftSpacing = minSpacing + rightShift;
  const rightSpacing = minSpacing;
  const chatBarWidth = Math.max(minChatBarWidth, totalAvailableSpace - leftSpacing - rightSpacing);
  const chatBarLeft = leftSidebarWidth + leftSpacing;
  
  return (
    <div
      className={cn(
        "fixed bottom-0 z-40 bg-background border-t border-border shadow-lg backdrop-blur-sm",
        "transition-all duration-300 ease-in-out",
        isExpanded ? 'h-[400px]' : 'h-[60px]'
      )}
      style={{
        left: `${chatBarLeft}px`,
        width: `${chatBarWidth}px`,
        backgroundColor: 'hsl(var(--background))',
      }}
    >
      {/* Header Bar */}
<<<<<<< HEAD
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted" style={{ backgroundColor: 'hsl(var(--muted))' }}>
=======
      <div className="flex items-center justify-between px-4 py-3 rounded-lg border-b border-border  bg-muted/30">
>>>>>>> 079de0c2c33a531f5544684a235edd4a504b6236
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <span className="text-sm font-semibold text-foreground">Luna</span>
          <div className="w-px h-4 bg-border"></div>
          <span className="text-sm font-normal text-muted-foreground">gemini-2.5-flash</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8"
          aria-label={isExpanded ? 'Minimize chat' : 'Expand chat'}
        >
          {isExpanded ? (
            <FaChevronDown className="h-4 w-4" />
          ) : (
            <FaChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Messages Area */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[280px] bg-background" style={{ backgroundColor: 'hsl(var(--background))' }}>
          {isDisabled ? (
            <div className="text-center text-muted-foreground mt-8">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Supabase Configuration Required</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  The chat feature requires Supabase to be configured. Please set up your Supabase credentials in <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">frontend/.env</code>.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground mt-8">
                  <p className="text-sm">Start chatting with Luna to modify your diagram.</p>
                  <p className="text-xs mt-2 text-muted-foreground/70">Example: "Add a database node"</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-4 py-2.5",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    <div className="text-xs font-medium mb-1.5 opacity-70">
                      {message.role === 'user' ? 'You' : 'Luna'}
                    </div>
                    <div className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        U
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span className="text-xs text-muted-foreground">Thinking...</span>
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
        className={cn(
          "px-4 py-3 border-t border-border bg-background",
          !isExpanded && 'flex items-center gap-2'
        )}
        style={{ backgroundColor: 'hsl(var(--background))' }}
      >
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isDisabled
                ? "Configure Supabase to enable chat..."
                : isExpanded
                ? "Ask Luna to modify your diagram... (Shift+Enter for new line)"
                : "Type a message..."
            }
            disabled={isLoading || isDisabled}
            className={cn(
              "resize-none min-h-[40px] max-h-[120px]",
              !isExpanded && 'min-h-[40px]'
            )}
            rows={1}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim() || isDisabled}
            size="icon"
            className="h-10 w-10 shrink-0"
            aria-label="Send message"
          >
            <FaPaperPlane className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
