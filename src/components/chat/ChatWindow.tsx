import { useRef, useEffect } from 'react';
import { EmptyState } from './EmptyState';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import type { Chat, Message, TeamCache, ScoutingReport, GameType } from '@/types/chat';

interface ChatWindowProps {
  chat: Chat | null;
  messages: Message[];
  loading: boolean;
  onSendMessage: (message: string, team?: string) => void;
  teams: TeamCache[];
  scoutingReports: Record<string, ScoutingReport>;
  selectedGame: GameType;
}

export function ChatWindow({
  chat,
  messages,
  loading,
  onSendMessage,
  teams,
  scoutingReports,
  selectedGame,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;
  const prevMessageCountRef = useRef(messages.length);
  const isUserScrolledRef = useRef(false);

  // Track if user manually scrolled up
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // If user is within 100px of bottom, consider them "at bottom"
    isUserScrolledRef.current = scrollHeight - scrollTop - clientHeight > 100;
  };

  // Only auto-scroll when user sends a new message (not when AI responds)
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const currentCount = messages.length;
    
    // Only scroll if a new user message was added (user just sent something)
    if (currentCount > prevCount && currentCount > 0) {
      const lastMessage = messages[currentCount - 1];
      if (lastMessage.role === 'user' && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
    
    prevMessageCountRef.current = currentCount;
  }, [messages]);

  // Use chat's game if in a chat, otherwise use selectedGame for empty state
  const game = chat?.game || selectedGame;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Empty state - centered input */}
      {!hasMessages && (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <EmptyState game={game} />
          <div className="w-full mt-8 mb-8">
            <MessageComposer
              onSend={onSendMessage}
              loading={loading}
              game={game}
              teams={teams}
              centered
            />
          </div>
        </div>
      )}

      {/* Messages view - input at bottom */}
      {hasMessages && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages area */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-8 min-h-0 bg-background"
          >
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  game={game}
                  scoutingReport={
                    message.is_first_team_report && message.team_mentioned
                      ? scoutingReports[message.team_mentioned]
                      : null
                  }
                />
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="bg-muted border border-border rounded-2xl px-5 py-4">
                    <div className="flex gap-2">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-pulse"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input at bottom */}
          <div className="border-t border-border bg-background px-4 py-5 flex-shrink-0">
            <MessageComposer
              onSend={onSendMessage}
              loading={loading}
              game={game}
              teams={teams}
            />
          </div>
        </div>
      )}
    </div>
  );
}
