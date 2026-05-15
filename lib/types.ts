export type Player = {
  id: number;
  name: string;
  color: string;
  gamertag: string | null;
  password_hash: string | null;
  created_at: string;
};

export type Team = {
  id: number;
  name: string;
  color: string;
  player1_id: number;
  player2_id: number;
  created_at: string;
};

export type TeamWithPlayers = Team & {
  player1: Player;
  player2: Player;
};

export type SeasonStatus = "active" | "upcoming" | "completed";

export type Season = {
  id: number;
  name: string;
  points_config: string; // JSON-encoded number[]
  start_date: string | null;
  end_date: string | null;
  status: SeasonStatus;
  regular_season_races: number;
  created_at: string;
};

export type Race = {
  id: number;
  season_id: number;
  track: string;
  mode: string | null;
  race_date: string;
  notes: string | null;
  screenshot: string | null;
  laps: number | null;
  weather: string | null;
  track_temp: string | null;
  created_at: string;
};

export type RaceResult = {
  id: number;
  race_id: number;
  player_id: number;
  position: number;
  dnf: number; // 0 or 1
  car: string | null;
  best_lap: string | null;
  total_time: string | null;
  penalties: number | null;
};

export type RaceWithResults = Race & {
  results: (RaceResult & { player: Player })[];
};
