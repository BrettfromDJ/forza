import type { Player, RaceWithResults, TeamWithPlayers } from "./types";

export function parsePoints(config: string): number[] {
  try {
    const arr = JSON.parse(config);
    if (Array.isArray(arr) && arr.every((n) => typeof n === "number"))
      return arr;
  } catch {}
  return [4, 3, 2, 1];
}

export function pointsForPosition(
  pointsConfig: number[],
  position: number,
  dnf: boolean,
): number {
  if (dnf) return 0;
  return pointsConfig[position - 1] ?? 0;
}

export type TeamRaceOutcome = {
  teamId: number;
  points: number;
  positions: number[];
  bestPosition: number;
  combinedPosition: number;
};

export function teamOutcomesForRace(
  race: RaceWithResults,
  teams: TeamWithPlayers[],
  pointsConfig: number[],
): TeamRaceOutcome[] {
  return teams.map((team) => {
    const memberIds = [team.player1_id, team.player2_id];
    const memberResults = race.results.filter((r) =>
      memberIds.includes(r.player_id),
    );
    const positions = memberResults.map((r) => r.position);
    const points = memberResults.reduce(
      (sum, r) => sum + pointsForPosition(pointsConfig, r.position, !!r.dnf),
      0,
    );
    return {
      teamId: team.id,
      points,
      positions,
      bestPosition: positions.length ? Math.min(...positions) : 99,
      combinedPosition: positions.reduce((a, b) => a + b, 0),
    };
  });
}

export type TeamSeasonStats = {
  team: TeamWithPlayers;
  races: number;
  raceWins: number; // races where this team scored higher than opponent
  raceTies: number;
  doublePodiums: number; // both members in top 2 (1+2)
  oneTwo: number; // 1st and 2nd places (a clean sweep)
  totalPoints: number;
  avgPoints: number;
  bestFinish: number; // best individual position by either teammate
  trackWins: Record<string, number>;
  pointsHistory: { raceId: number; cumulative: number }[];
};

export function computeTeamSeasonStats(
  races: RaceWithResults[],
  teams: TeamWithPlayers[],
  pointsConfig: number[],
): TeamSeasonStats[] {
  const ordered = [...races].sort(
    (a, b) =>
      new Date(a.race_date).getTime() - new Date(b.race_date).getTime() ||
      a.id - b.id,
  );

  return teams.map((team) => {
    const stats: TeamSeasonStats = {
      team,
      races: 0,
      raceWins: 0,
      raceTies: 0,
      doublePodiums: 0,
      oneTwo: 0,
      totalPoints: 0,
      avgPoints: 0,
      bestFinish: 99,
      trackWins: {},
      pointsHistory: [],
    };

    let cumulative = 0;
    for (const race of ordered) {
      const outcomes = teamOutcomesForRace(race, teams, pointsConfig);
      const us = outcomes.find((o) => o.teamId === team.id);
      if (!us || us.positions.length === 0) continue;
      stats.races++;
      stats.totalPoints += us.points;
      cumulative += us.points;
      stats.pointsHistory.push({ raceId: race.id, cumulative });

      const sorted = us.positions.slice().sort((a, b) => a - b);
      if (sorted[0] === 1 && sorted[1] === 2) stats.oneTwo++;
      if (sorted[0] <= 2 && sorted[1] <= 2) stats.doublePodiums++;
      if (sorted[0] < stats.bestFinish) stats.bestFinish = sorted[0];

      const opp = outcomes.find((o) => o.teamId !== team.id);
      if (opp) {
        if (us.points > opp.points) {
          stats.raceWins++;
          stats.trackWins[race.track] = (stats.trackWins[race.track] || 0) + 1;
        } else if (us.points === opp.points) {
          stats.raceTies++;
        }
      }
    }

    stats.avgPoints = stats.races ? stats.totalPoints / stats.races : 0;
    return stats;
  });
}

export type PlayerSeasonStats = {
  playerId: number;
  races: number;
  wins: number;
  podiums: number; // pos 1 or 2
  avgPosition: number;
  bestPosition: number;
  totalPoints: number;
  dnfs: number;
  positionCounts: Record<number, number>;
};

export function computePlayerSeasonStats(
  races: RaceWithResults[],
  pointsConfig: number[],
  playerIds: number[],
): PlayerSeasonStats[] {
  return playerIds.map((playerId) => {
    const stats: PlayerSeasonStats = {
      playerId,
      races: 0,
      wins: 0,
      podiums: 0,
      avgPosition: 0,
      bestPosition: 99,
      totalPoints: 0,
      dnfs: 0,
      positionCounts: {},
    };
    let positionSum = 0;
    let counted = 0;
    for (const race of races) {
      const r = race.results.find((x) => x.player_id === playerId);
      if (!r) continue;
      stats.races++;
      if (r.dnf) {
        stats.dnfs++;
        continue;
      }
      counted++;
      positionSum += r.position;
      stats.totalPoints += pointsForPosition(pointsConfig, r.position, false);
      stats.positionCounts[r.position] =
        (stats.positionCounts[r.position] || 0) + 1;
      if (r.position === 1) stats.wins++;
      if (r.position <= 2) stats.podiums++;
      if (r.position < stats.bestPosition) stats.bestPosition = r.position;
    }
    stats.avgPosition = counted ? positionSum / counted : 0;
    return stats;
  });
}

export type SeasonMVP = {
  player: Player;
  wins: number;
  podiums: number;
  totalPoints: number;
  avgPosition: number;
  score: number;
};

export function computeSeasonMVP(
  playerStats: PlayerSeasonStats[],
  players: Player[],
): SeasonMVP | null {
  const candidates = playerStats
    .filter((s) => s.races > 0)
    .map((s) => ({
      ...s,
      // Weighted: wins matter most, then podiums, then raw points
      score: s.wins * 10 + s.podiums * 3 + s.totalPoints,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.avgPosition || 99) - (b.avgPosition || 99),
    );

  if (candidates.length === 0) return null;
  const top = candidates[0];
  const player = players.find((p) => p.id === top.playerId);
  if (!player) return null;
  return {
    player,
    wins: top.wins,
    podiums: top.podiums,
    totalPoints: top.totalPoints,
    avgPosition: top.avgPosition,
    score: top.score,
  };
}
