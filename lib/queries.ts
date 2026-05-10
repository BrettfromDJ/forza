import { getDb } from "./db";
import type {
  Player,
  Team,
  TeamWithPlayers,
  Season,
  Race,
  RaceResult,
  RaceWithResults,
} from "./types";

export function listPlayers(): Player[] {
  return getDb()
    .prepare("SELECT * FROM players ORDER BY id ASC")
    .all() as Player[];
}

export function getPlayer(id: number): Player | undefined {
  return getDb()
    .prepare("SELECT * FROM players WHERE id = ?")
    .get(id) as Player | undefined;
}

export function listTeams(): TeamWithPlayers[] {
  const teams = getDb()
    .prepare("SELECT * FROM teams ORDER BY id ASC")
    .all() as Team[];
  const players = listPlayers();
  return teams.map((t) => ({
    ...t,
    player1: players.find((p) => p.id === t.player1_id)!,
    player2: players.find((p) => p.id === t.player2_id)!,
  }));
}

export function getTeam(id: number): TeamWithPlayers | undefined {
  const teams = listTeams();
  return teams.find((t) => t.id === id);
}

export function getTeamForPlayer(playerId: number): TeamWithPlayers | undefined {
  return listTeams().find(
    (t) => t.player1_id === playerId || t.player2_id === playerId,
  );
}

export function listSeasons(): Season[] {
  return getDb()
    .prepare("SELECT * FROM seasons ORDER BY id DESC")
    .all() as Season[];
}

export function getSeason(id: number): Season | undefined {
  return getDb()
    .prepare("SELECT * FROM seasons WHERE id = ?")
    .get(id) as Season | undefined;
}

export function getActiveSeason(): Season | undefined {
  return getDb()
    .prepare(
      "SELECT * FROM seasons WHERE status = 'active' ORDER BY id DESC LIMIT 1",
    )
    .get() as Season | undefined;
}

export function listRaces(seasonId: number): Race[] {
  return getDb()
    .prepare(
      "SELECT * FROM races WHERE season_id = ? ORDER BY race_date DESC, id DESC",
    )
    .all(seasonId) as Race[];
}

export function getRaceWithResults(id: number): RaceWithResults | undefined {
  const race = getDb()
    .prepare("SELECT * FROM races WHERE id = ?")
    .get(id) as Race | undefined;
  if (!race) return undefined;
  const results = getDb()
    .prepare("SELECT * FROM race_results WHERE race_id = ? ORDER BY position")
    .all(id) as RaceResult[];
  const players = listPlayers();
  return {
    ...race,
    results: results.map((r) => ({
      ...r,
      player: players.find((p) => p.id === r.player_id)!,
    })),
  };
}

export function listRacesWithResults(seasonId: number): RaceWithResults[] {
  return listRaces(seasonId)
    .map((r) => getRaceWithResults(r.id)!)
    .filter(Boolean);
}

export function isSetupComplete(): boolean {
  const playerCount = (
    getDb().prepare("SELECT COUNT(*) as c FROM players").get() as { c: number }
  ).c;
  const teamCount = (
    getDb().prepare("SELECT COUNT(*) as c FROM teams").get() as { c: number }
  ).c;
  return playerCount >= 4 && teamCount >= 2;
}
