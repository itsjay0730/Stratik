import { useState } from 'react';
import { Plus, Search, MessageSquare, LogOut, Menu, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Chat, GameType } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { StratikLogo } from './StratikLogo';

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  selectedGame: GameType;
  onGameChange: (game: GameType) => void;
  onSelectChat: (chat: Chat) => void;
  onNewChat: (game: GameType) => void;
  onDeleteChat: (chatId: string) => void;
  onSignOut: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatSidebar({
  chats,
  activeChatId,
  selectedGame,
  onGameChange,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onSignOut,
  isOpen,
  onToggle,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter chats by selected game AND search query
  const filteredChats = chats.filter((chat) =>
    chat.game === selectedGame && 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'h-full w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300',
          'fixed lg:relative z-50 lg:z-auto lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <StratikLogo game={selectedGame} />
              <span className="font-display font-bold text-lg tracking-wider">STRATIK</span>
            </div>
            
            {/* Game Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onGameChange('valorant')}
                className={cn(
                  "px-2 py-1 text-xs font-bold rounded transition-all",
                  selectedGame === 'valorant' 
                    ? "bg-[hsl(352,100%,63%)]/20 text-[hsl(352,100%,63%)] border border-[hsl(352,100%,63%)]/30" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                VAL
              </button>
              <button
                onClick={() => onGameChange('league')}
                className={cn(
                  "px-2 py-1 text-xs font-bold rounded transition-all",
                  selectedGame === 'league' 
                    ? "bg-[hsl(43,55%,61%)]/20 text-[hsl(43,55%,61%)] border border-[hsl(43,55%,61%)]/30" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                LoL
              </button>
              
              <button
                onClick={onToggle}
                className="lg:hidden p-2 hover:bg-sidebar-accent rounded-md transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* New Chat Button - no dropdown, uses selected game */}
          <Button
            onClick={() => onNewChat(selectedGame)}
            className="w-full h-11 font-display font-semibold tracking-wider bg-primary hover:bg-primary-bright text-primary-foreground gap-2"
          >
            <Plus className="w-5 h-5" />
            NEW CHAT
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-sidebar-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-sidebar-accent border-sidebar-border text-sm"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    'group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all overflow-hidden',
                    activeChatId === chat.id
                      ? 'bg-sidebar-accent border-l-2 border-primary'
                      : 'hover:bg-sidebar-accent/50'
                  )}
                  onClick={() => onSelectChat(chat)}
                >
                  <div className="flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm block">
                      {chat.title.length > 28 ? chat.title.slice(0, 28) + '...' : chat.title}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-all ml-1"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-card border border-border rounded-lg shadow-md"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
