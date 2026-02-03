export type GameType = 'valorant' | 'league';

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  game: GameType;
  reported_teams: string[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  team_mentioned?: string | null;
  is_first_team_report?: boolean;
  created_at: string;
}

export interface TeamCache {
  id: string;
  game: GameType;
  team_id: string;
  team_name: string;
  team_logo_url?: string | null;
  cached_at: string;
}

export interface ScoutingReport {
  teamId: string;
  teamName: string;
  report: string;
  metrics?: {
    agg?: {
      seriesCount?: number;
      totalRounds?: number;
      attackWinRate?: number;
      pistolWinRate?: number;
      firstBloodRate?: number;
      avgRoundDuration?: number;
    };
  };
}
