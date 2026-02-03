import { Shield, Crosshair, Eye, Zap, Target } from 'lucide-react';
import type { GameType } from '@/types/chat';

interface EmptyStateProps {
  game: GameType;
}

export function EmptyState({ game }: EmptyStateProps) {
  const isLeague = game === 'league';

  const features = [
    { icon: Shield, label: 'Team Comps' },
    { icon: Crosshair, label: 'Strategies' },
    { icon: Eye, label: 'Playstyles' },
    { icon: Zap, label: 'Counters' },
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8">
      {/* Logo */}
      <div className="mb-6 p-5 rounded-2xl bg-primary/10 border border-primary/20">
        <Target className="w-12 h-12 text-primary" />
      </div>

      {/* Title */}
      <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wider mb-2">
        <span className="text-foreground">TACTICAL</span>{' '}
        <span className="text-primary">ANALYSIS</span>
      </h1>

      {/* Subtitle */}
      <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto mb-6">
        {isLeague
          ? 'Scout reports & counter strategies for League of Legends'
          : 'Scout reports & counter strategies for competitive Valorant'}
      </p>

      {/* Game mode badge */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">
            {isLeague ? 'LEAGUE OF LEGENDS' : 'VALORANT'} MODE
          </span>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl">
        {features.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card/50 hover:border-primary/30 transition-colors"
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium text-sm">{label}</span>
          </div>
        ))}
      </div>

      {/* Hint */}
      <p className="mt-8 text-muted-foreground text-sm">
        Ask about teams, maps, compositions, or strategies...
      </p>
    </div>
  );
}
