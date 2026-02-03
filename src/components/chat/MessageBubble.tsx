import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message, GameType } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import { ScoutingReportCard } from './ScoutingReportCard';
import type { ScoutingReport } from '@/types/chat';
import { StratikLogo } from './StratikLogo';

interface MessageBubbleProps {
  message: Message;
  scoutingReport?: ScoutingReport | null;
  game: GameType;
}

export function MessageBubble({ message, scoutingReport, game }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
          isUser 
            ? 'bg-primary/20 border border-primary/30' 
            : 'bg-muted border border-border'
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-primary" />
        ) : (
          <StratikLogo game={game} />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-5 py-4',
          isUser 
            ? 'bg-primary/10 border border-primary/20' 
            : 'bg-card border border-border'
        )}
      >
        {/* Show scouting report card if this is a first team report */}
        {message.is_first_team_report && scoutingReport && (
          <ScoutingReportCard report={scoutingReport} />
        )}
        
        {/* Regular message content */}
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
              strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-sm">{children}</li>,
              h1: ({ children }) => <h1 className="text-lg font-bold text-primary mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-bold text-primary mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-bold text-primary mb-1">{children}</h3>,
              code: ({ children }) => (
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{children}</code>
              ),
              pre: ({ children }) => (
                <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-xs">{children}</pre>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
