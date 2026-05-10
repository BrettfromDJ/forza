import Link from "next/link";
import type { TeamSeasonStats } from "@/lib/scoring";

export function StandingsScoreboard({
  stats,
}: {
  stats: TeamSeasonStats[];
}) {
  if (stats.length === 0) return null;
  const sorted = [...stats].sort(
    (a, b) => b.totalPoints - a.totalPoints || b.raceWins - a.raceWins,
  );
  const max = Math.max(...sorted.map((s) => s.totalPoints), 1);
  const leader = sorted[0];
  const lead = leader.totalPoints - (sorted[1]?.totalPoints ?? 0);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-surface to-surface-2 border border-line/60 overflow-hidden">
      <div className="grid md:grid-cols-2">
        {sorted.map((s, idx) => {
          const pct = (s.totalPoints / max) * 100;
          const isLeader = idx === 0 && lead > 0;
          return (
            <Link
              href={`/teams/${s.team.id}`}
              key={s.team.id}
              className="relative p-6 md:p-8 group hover:bg-white/[0.02] transition border-b md:border-b-0 md:border-r border-line/40 last:border-0"
            >
              <div
                className="absolute inset-x-0 bottom-0 h-1 transition-all"
                style={{ background: s.team.color, width: `${pct}%` }}
              />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: s.team.color }}
                    />
                    <span className="text-xs text-ink-mute font-mono">
                      P{idx + 1}
                    </span>
                    {isLeader && (
                      <span className="text-[10px] font-bold uppercase bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                        Leader · +{lead}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl md:text-3xl font-black tracking-tight">
                    {s.team.name}
                  </div>
                  <div className="text-sm text-ink-dim mt-1">
                    {s.team.player1.name} & {s.team.player2.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-5xl md:text-6xl font-black tabular-nums leading-none">
                    {s.totalPoints}
                  </div>
                  <div className="text-xs text-ink-mute mt-1">PTS</div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-4 gap-2 text-center">
                <Stat label="Races" value={s.races} />
                <Stat label="Wins" value={s.raceWins} />
                <Stat label="1-2s" value={s.oneTwo} />
                <Stat label="Avg" value={s.avgPoints.toFixed(1)} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-black/30 rounded-lg py-2">
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-ink-mute uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
