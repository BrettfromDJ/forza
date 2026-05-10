import Link from "next/link";
import type { RaceWithResults, TeamWithPlayers } from "@/lib/types";
import { teamOutcomesForRace } from "@/lib/scoring";

export function RaceCard({
  race,
  teams,
  pointsConfig,
}: {
  race: RaceWithResults;
  teams: TeamWithPlayers[];
  pointsConfig: number[];
}) {
  const outcomes = teamOutcomesForRace(race, teams, pointsConfig);
  const sorted = [...outcomes].sort((a, b) => b.points - a.points);
  const winnerId =
    sorted.length > 1 && sorted[0].points > sorted[1].points
      ? sorted[0].teamId
      : null;

  return (
    <Link
      href={`/races/${race.id}`}
      className="block bg-surface rounded-xl border border-line/60 hover:border-line hover:bg-surface-2 transition overflow-hidden"
    >
      <div className="flex">
        {race.screenshot ? (
          <div
            className="w-32 sm:w-40 bg-cover bg-center shrink-0"
            style={{
              backgroundImage: `url('/api/uploads/${race.screenshot}')`,
            }}
            aria-hidden
          />
        ) : (
          <div className="w-32 sm:w-40 race-grid shrink-0" aria-hidden />
        )}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold truncate">{race.track}</div>
              <div className="text-xs text-ink-mute mt-0.5">
                {race.race_date}
                {race.mode ? ` · ${race.mode}` : ""}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {teams.map((team) => {
              const o = outcomes.find((x) => x.teamId === team.id)!;
              const isWinner = winnerId === team.id;
              return (
                <div
                  key={team.id}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs ${
                    isWinner
                      ? "bg-white/10 ring-1"
                      : "bg-black/30"
                  }`}
                  style={
                    isWinner ? { boxShadow: `inset 0 0 0 1px ${team.color}` } : {}
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: team.color }}
                  />
                  <span className="font-semibold">{team.name}</span>
                  <span className="text-ink-dim">
                    P{o.positions.sort((a, b) => a - b).join(" · P")}
                  </span>
                  <span className="font-bold tabular-nums">{o.points}pt</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Link>
  );
}
