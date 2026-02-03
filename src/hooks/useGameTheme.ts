import { useEffect } from 'react';
import type { GameType } from '@/types/chat';

export function useGameTheme(game: GameType | null) {
  useEffect(() => {
    if (game) {
      document.documentElement.dataset.game = game;
    } else {
      document.documentElement.dataset.game = 'valorant';
    }
    
    return () => {
      document.documentElement.dataset.game = 'valorant';
    };
  }, [game]);
}
