import type { RaceWithResults } from "./types";

export type DriverH2H = {
  opponentId: number;
  ahead: number;
  behind: number;
  shared: number; // races where neither DNF'd
  wins: number; // races where both finished and player_id finished P1
  oppWins: number;
};

export function computeDriverH2H(
  playerId: number,
  opponentIds: number[],
  races: RaceWithResults[],
): DriverH2H[] {
  return opponentIds.map((opponentId) => {
    let ahead = 0;
    let behind = 0;
    let shared = 0;
    let wins = 0;
    let oppWins = 0;
    for (const race of races) {
      const me = race.results.find((r) => r.player_id === playerId);
      const them = race.results.find((r) => r.player_id === opponentId);
      if (!me || !them) continue;
      if (me.dnf || them.dnf) continue;
      shared++;
      if (me.position < them.position) ahead++;
      else if (me.position > them.position) behind++;
      if (me.position === 1) wins++;
      if (them.position === 1) oppWins++;
    }
    return { opponentId, ahead, behind, shared, wins, oppWins };
  });
}
