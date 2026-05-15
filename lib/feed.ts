import type {
  Player,
  RaceWithResults,
  Season,
  TeamWithPlayers,
} from "./types";
import {
  parsePoints,
  teamOutcomesForRace,
} from "./scoring";
import {
  ACHIEVEMENTS,
  computeAchievements,
  type AchievementDef,
} from "./achievements";

export type FeedItem =
  | {
      kind: "race";
      id: string;
      raceId: number;
      date: string;
      track: string;
      seasonName: string;
      isTie: boolean;
      winningTeam: TeamWithPlayers | null;
      p1Player: Player | null;
    }
  | {
      kind: "achievement";
      id: string;
      raceId: number;
      date: string;
      seasonName: string;
      player: Player;
      achievement: AchievementDef;
    };

type Args = {
  players: Player[];
  teams: TeamWithPlayers[];
  seasons: Season[];
  racesBySeason: Record<number, RaceWithResults[]>;
};

export function buildActivityFeed({
  players,
  teams,
  seasons,
  racesBySeason,
}: Args): FeedItem[] {
  type Entry = { race: RaceWithResults; season: Season };
  const allRaces: Entry[] = [];
  for (const season of seasons) {
    for (const race of racesBySeason[season.id] || []) {
      allRaces.push({ race, season });
    }
  }
  allRaces.sort(
    (a, b) =>
      new Date(a.race.race_date).getTime() -
        new Date(b.race.race_date).getTime() || a.race.id - b.race.id,
  );

  const earnedPerPlayer = new Map<number, Set<string>>();
  for (const p of players) earnedPerPlayer.set(p.id, new Set());

  const racesUpToNow: Record<number, RaceWithResults[]> = {};
  for (const season of seasons) racesUpToNow[season.id] = [];

  const items: FeedItem[] = [];

  for (const { race, season } of allRaces) {
    racesUpToNow[season.id].push(race);

    const points = parsePoints(season.points_config);
    const outcomes = teamOutcomesForRace(race, teams, points);
    const sorted = [...outcomes].sort((a, b) => b.points - a.points);
    const isTie =
      sorted.length > 1 && sorted[0].points === sorted[1].points;
    const winningTeam =
      !isTie && sorted.length > 1
        ? (teams.find((t) => t.id === sorted[0].teamId) ?? null)
        : null;
    const p1Result = race.results.find((r) => r.position === 1 && !r.dnf);
    const p1Player = p1Result
      ? (players.find((p) => p.id === p1Result.player_id) ?? null)
      : null;

    items.push({
      kind: "race",
      id: `race-${race.id}`,
      raceId: race.id,
      date: race.race_date,
      track: race.track,
      seasonName: season.name,
      isTie,
      winningTeam,
      p1Player,
    });

    for (const player of players) {
      const current = computeAchievements(player.id, seasons, racesUpToNow);
      const earnedSet = earnedPerPlayer.get(player.id)!;
      for (const a of current) {
        if (a.earned && !earnedSet.has(a.id)) {
          const def = ACHIEVEMENTS.find((d) => d.id === a.id);
          if (!def) continue;
          items.push({
            kind: "achievement",
            id: `ach-${player.id}-${a.id}`,
            raceId: race.id,
            date: race.race_date,
            seasonName: season.name,
            player,
            achievement: def,
          });
          earnedSet.add(a.id);
        }
      }
    }
  }

  items.reverse();
  return items;
}

export function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (Number.isNaN(days)) return dateStr;
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
