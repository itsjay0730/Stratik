import { cn } from '@/lib/utils';
import type { GameType } from '@/types/chat';

interface StratikLogoProps {
  game: GameType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StratikLogo({ game, className, size = 'md' }: StratikLogoProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-12 h-12',
  };

  const strokeColor = game === 'valorant' ? 'hsl(352, 100%, 63%)' : 'hsl(43, 55%, 61%)';

  return (
    <svg 
      viewBox="0 0 24 24" 
      className={cn(sizeClasses[size], className)}
      fill="none"
    >
      {/* Outer circle */}
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke={strokeColor} 
        strokeWidth="1.5"
      />
      {/* Middle circle */}
      <circle 
        cx="12" 
        cy="12" 
        r="6" 
        stroke={strokeColor} 
        strokeWidth="1.5"
      />
      {/* Inner circle (ring with hole) */}
      <circle 
        cx="12" 
        cy="12" 
        r="2.5" 
        stroke={strokeColor}
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
