export type GameType = "valorant" | "league";

export type MessageRole = "user" | "assistant";

interface Timestamps {
  created_at: string;
  updated_at?: string;
}

export interface Chat extends Timestamps {
  id: string;
  user_id: string;
  title: string;
  game: GameType;
  reported_teams: string[];
}

export interface Message extends Timestamps {
  id: string;
  chat_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  team_mentioned?: string | null;
  is_first_team_report?: boolean;
}

export interface TeamCache {
  id: string;
  game: GameType;
  team_id: string;
  team_name: string;
  team_logo_url?: string | null;
  cached_at: string;
}

export interface AggregatedMetrics {
  seriesCount?: number;
  totalRounds?: number;
  attackWinRate?: number;
  pistolWinRate?: number;
  firstBloodRate?: number;
  avgRoundDuration?: number;
}

export interface ScoutingReport {
  teamId: string;
  teamName: string;
  report: string;
  metrics?: {
    agg?: AggregatedMetrics;
  };
}
