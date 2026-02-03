import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GameType, TeamCache } from '@/types/chat';

interface MessageComposerProps {
  onSend: (message: string, team?: string) => void;
  loading: boolean;
  game: GameType;
  teams: TeamCache[];
  centered?: boolean;
  placeholder?: string;
}

export function MessageComposer({
  onSend,
  loading,
  game,
  teams,
  centered = false,
  placeholder,
}: MessageComposerProps) {
  const [input, setInput] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    
    onSend(input.trim(), selectedTeam || undefined);
    setInput('');
    setSelectedTeam(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const isLeague = game === 'league';
  const defaultPlaceholder = isLeague 
    ? 'Ask about a League team, draft strategy...' 
    : 'Ask about a Valorant team, maps, compositions...';

  return (
    <div className={cn(
      'w-full max-w-3xl mx-auto',
      centered && 'py-4'
    )}>
      {/* Team tag if selected */}
      {selectedTeam && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground font-medium">SCOUTING:</span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            {selectedTeam}
            <button
              onClick={() => setSelectedTeam(null)}
              className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

      {/* Input container */}
      <form onSubmit={handleSubmit}>
        <div className="flex items-end gap-3 rounded-xl p-3 bg-card border border-border focus-within:border-primary/50 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || defaultPlaceholder}
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-base placeholder:text-muted-foreground min-h-[48px] py-3"
          />

          <Button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-12 px-5"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>

      {/* Help text */}
      {centered && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">Enter</kbd> to send
          {' · '}
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">Shift+Enter</kbd> for new line
        </p>
      )}
    </div>
  );
}
