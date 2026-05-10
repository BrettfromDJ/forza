import type { RaceWithResults, Season } from "./types";
import { parsePoints, pointsForPosition } from "./scoring";

export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
};

export type AwardedAchievement = AchievementDef & {
  earned: boolean;
  detail?: string; // when/where earned
  progress?: { current: number; target: number };
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_win",
    name: "First Blood",
    description: "Win your first race.",
    icon: "🥇",
  },
  {
    id: "hat_trick",
    name: "Hat Trick",
    description: "Win three races in a row.",
    icon: "🎩",
  },
  {
    id: "podium_streak_5",
    name: "On Fire",
    description: "Five consecutive podium finishes (P1 or P2).",
    icon: "🔥",
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Score 100 lifetime points.",
    icon: "💯",
  },
  {
    id: "iron_driver",
    name: "Iron Driver",
    description: "Start 25 races.",
    icon: "🛡️",
  },
  {
    id: "track_master",
    name: "Track Master",
    description: "Win the same track three or more times.",
    icon: "🗺️",
  },
  {
    id: "bridesmaid",
    name: "Always the Bridesmaid",
    description: "Finish P2 five times.",
    icon: "💐",
  },
  {
    id: "season_sweep",
    name: "Season Sweep",
    description: "Win every regular-season race in a completed season.",
    icon: "🧹",
  },
  {
    id: "comeback_kid",
    name: "Comeback Kid",
    description: "Finish P4, then win the very next race.",
    icon: "🚀",
  },
  {
    id: "flawless_season",
    name: "Flawless",
    description: "Complete a full season without a single DNF.",
    icon: "💎",
  },
];

type RaceForPlayer = {
  race: RaceWithResults;
  position: number;
  dnf: boolean;
  points: number;
  seasonId: number;
  seasonName: string;
};

function chronological(
  races: RaceWithResults[],
): RaceWithResults[] {
  return races.slice().sort(
    (a, b) =>
      new Date(a.race_date).getTime() - new Date(b.race_date).getTime() ||
      a.id - b.id,
  );
}

export function computeAchievements(
  playerId: number,
  allSeasons: Season[],
  racesBySeason: Record<number, RaceWithResults[]>,
): AwardedAchievement[] {
  // Flatten all races chronologically across seasons
  const allEntries: RaceForPlayer[] = [];
  for (const season of allSeasons) {
    const points = parsePoints(season.points_config);
    const races = chronological(racesBySeason[season.id] || []);
    for (const race of races) {
      const r = race.results.find((x) => x.player_id === playerId);
      if (!r) continue;
      allEntries.push({
        race,
        position: r.position,
        dnf: !!r.dnf,
        points: pointsForPosition(points, r.position, !!r.dnf),
        seasonId: season.id,
        seasonName: season.name,
      });
    }
  }
  allEntries.sort(
    (a, b) =>
      new Date(a.race.race_date).getTime() -
        new Date(b.race.race_date).getTime() || a.race.id - b.race.id,
  );

  const totalRaces = allEntries.length;
  const totalPoints = allEntries.reduce((s, e) => s + e.points, 0);
  const wins = allEntries.filter((e) => !e.dnf && e.position === 1);
  const seconds = allEntries.filter((e) => !e.dnf && e.position === 2);
  const firstWin = wins[0];

  // Hat trick: 3 wins in a row by chronological race order
  let hatTrickRace: RaceForPlayer | undefined;
  {
    let streak = 0;
    for (const e of allEntries) {
      if (!e.dnf && e.position === 1) {
        streak++;
        if (streak >= 3) {
          hatTrickRace = e;
          break;
        }
      } else {
        streak = 0;
      }
    }
  }

  // Podium streak (5)
  let podiumStreakRace: RaceForPlayer | undefined;
  let bestPodiumStreak = 0;
  {
    let streak = 0;
    for (const e of allEntries) {
      if (!e.dnf && e.position <= 2) {
        streak++;
        if (streak > bestPodiumStreak) bestPodiumStreak = streak;
        if (streak >= 5 && !podiumStreakRace) podiumStreakRace = e;
      } else {
        streak = 0;
      }
    }
  }

  // Track master
  const trackWinCounts: Record<string, number> = {};
  let trackMasterTrack: string | undefined;
  for (const e of wins) {
    const key = e.race.track;
    trackWinCounts[key] = (trackWinCounts[key] || 0) + 1;
    if (trackWinCounts[key] >= 3 && !trackMasterTrack) trackMasterTrack = key;
  }
  const bestTrackWins = Math.max(0, ...Object.values(trackWinCounts));

  // Comeback kid: P4 then P1 in the next race
  let comebackRace: RaceForPlayer | undefined;
  for (let i = 1; i < allEntries.length; i++) {
    const prev = allEntries[i - 1];
    const cur = allEntries[i];
    if (!prev.dnf && prev.position === 4 && !cur.dnf && cur.position === 1) {
      comebackRace = cur;
      break;
    }
  }

  // Per-season analysis: sweep + flawless (only for completed seasons with races)
  let sweepSeason: string | undefined;
  let flawlessSeason: string | undefined;
  for (const season of allSeasons) {
    if (season.status !== "completed") continue;
    const seasonRaces = racesBySeason[season.id] || [];
    if (seasonRaces.length === 0) continue;
    const myEntries = seasonRaces
      .map((race) => race.results.find((r) => r.player_id === playerId))
      .filter((r): r is NonNullable<typeof r> => !!r);
    if (myEntries.length === 0) continue;

    // Sweep: every regular-season race won (and at least one race)
    const targetCount = Math.min(seasonRaces.length, season.regular_season_races);
    const regularSeasonResults = myEntries.slice(0, targetCount);
    if (
      regularSeasonResults.length === targetCount &&
      targetCount > 0 &&
      regularSeasonResults.every((r) => !r.dnf && r.position === 1)
    ) {
      sweepSeason ||= season.name;
    }

    // Flawless: no DNF in any race they entered for that season
    if (myEntries.length >= 3 && myEntries.every((r) => !r.dnf)) {
      flawlessSeason ||= season.name;
    }
  }

  const all: AwardedAchievement[] = [
    {
      ...defOf("first_win"),
      earned: !!firstWin,
      detail: firstWin
        ? `${firstWin.race.track} · ${firstWin.race.race_date}`
        : undefined,
    },
    {
      ...defOf("hat_trick"),
      earned: !!hatTrickRace,
      detail: hatTrickRace
        ? `Sealed at ${hatTrickRace.race.track}`
        : undefined,
    },
    {
      ...defOf("podium_streak_5"),
      earned: !!podiumStreakRace,
      detail: podiumStreakRace
        ? `Hit at ${podiumStreakRace.race.track}`
        : undefined,
      progress: podiumStreakRace
        ? undefined
        : { current: bestPodiumStreak, target: 5 },
    },
    {
      ...defOf("centurion"),
      earned: totalPoints >= 100,
      detail: totalPoints >= 100 ? `${totalPoints} career pts` : undefined,
      progress:
        totalPoints >= 100 ? undefined : { current: totalPoints, target: 100 },
    },
    {
      ...defOf("iron_driver"),
      earned: totalRaces >= 25,
      detail: totalRaces >= 25 ? `${totalRaces} races started` : undefined,
      progress:
        totalRaces >= 25 ? undefined : { current: totalRaces, target: 25 },
    },
    {
      ...defOf("track_master"),
      earned: !!trackMasterTrack,
      detail: trackMasterTrack
        ? `${trackMasterTrack} · ${trackWinCounts[trackMasterTrack]} wins`
        : undefined,
      progress: trackMasterTrack
        ? undefined
        : { current: bestTrackWins, target: 3 },
    },
    {
      ...defOf("bridesmaid"),
      earned: seconds.length >= 5,
      detail:
        seconds.length >= 5
          ? `${seconds.length} runner-up finishes`
          : undefined,
      progress:
        seconds.length >= 5
          ? undefined
          : { current: seconds.length, target: 5 },
    },
    {
      ...defOf("season_sweep"),
      earned: !!sweepSeason,
      detail: sweepSeason ? `${sweepSeason}` : undefined,
    },
    {
      ...defOf("comeback_kid"),
      earned: !!comebackRace,
      detail: comebackRace ? `${comebackRace.race.track}` : undefined,
    },
    {
      ...defOf("flawless_season"),
      earned: !!flawlessSeason,
      detail: flawlessSeason ? `${flawlessSeason}` : undefined,
    },
  ];

  return all;
}

function defOf(id: string): AchievementDef {
  return ACHIEVEMENTS.find((a) => a.id === id)!;
}
