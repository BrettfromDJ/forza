import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getActiveSeason,
  getPlayer,
  getTeamForPlayer,
  listPlayers,
  listRacesWithResults,
  listSeasons,
} from "@/lib/queries";
import {
  computePlayerSeasonStats,
  parsePoints,
  pointsForPosition,
} from "@/lib/scoring";

export default async function PlayerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = getPlayer(Number(id));
  if (!player) notFound();
  const team = getTeamForPlayer(player.id);
  const seasons = listSeasons();
  const active = getActiveSeason() ?? seasons[0];

  const allPlayers = listPlayers();
  const seasonStats = active
    ? computePlayerSeasonStats(
        listRacesWithResults(active.id),
        parsePoints(active.points_config),
        allPlayers.map((p) => p.id),
      ).find((s) => s.playerId === player.id)
    : undefined;

  let lifetimeRaces = 0;
  let lifetimeWins = 0;
  let lifetimePodiums = 0;
  let lifetimePoints = 0;
  let positionSum = 0;
  let counted = 0;
  for (const s of seasons) {
    const races = listRacesWithResults(s.id);
    const points = parsePoints(s.points_config);
    for (const r of races) {
      const res = r.results.find((x) => x.player_id === player.id);
      if (!res) continue;
      lifetimeRaces++;
      if (!res.dnf) {
        counted++;
        positionSum += res.position;
        lifetimePoints += pointsForPosition(points, res.position, false);
        if (res.position === 1) lifetimeWins++;
        if (res.position <= 2) lifetimePodiums++;
      }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-ink-dim hover:text-ink">
          ← Home
        </Link>
        <div
          className="mt-3 rounded-3xl p-8 border border-line/60 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${player.color}33, transparent 70%), var(--color-surface)`,
          }}
        >
          <div className="text-xs uppercase tracking-[0.2em] text-ink-mute">
            Driver
          </div>
          <h1 className="text-5xl font-black tracking-tight mt-1">
            {player.name}
          </h1>
          {team && (
            <Link
              href={`/teams/${team.id}`}
              className="inline-block mt-3 px-3 py-1.5 rounded-full bg-black/30 hover:bg-black/50 text-sm"
              style={{ color: team.color }}
            >
              {team.name}
            </Link>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-sm uppercase tracking-[0.2em] text-ink-mute font-bold mb-3">
          {active ? `${active.name}` : "Current season"}
        </h2>
        {seasonStats && seasonStats.races > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Big label="Points" value={seasonStats.totalPoints} />
            <Big label="Wins" value={seasonStats.wins} />
            <Big label="Podiums" value={seasonStats.podiums} />
            <Big
              label="Avg pos"
              value={
                seasonStats.avgPosition
                  ? `P${seasonStats.avgPosition.toFixed(1)}`
                  : "—"
              }
            />
            <Big label="Races" value={seasonStats.races} />
            <Big
              label="Best"
              value={
                seasonStats.bestPosition < 99
                  ? `P${seasonStats.bestPosition}`
                  : "—"
              }
            />
            <Big label="DNFs" value={seasonStats.dnfs} />
            <PositionBreakdown counts={seasonStats.positionCounts} />
          </div>
        ) : (
          <div className="bg-surface border border-line/60 border-dashed rounded-2xl p-8 text-center text-ink-dim">
            No races logged this season.
          </div>
        )}
      </section>

      <section className="bg-surface rounded-2xl border border-line/60 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-mute font-bold mb-3">
          All-time
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          <Big label="Races" value={lifetimeRaces} />
          <Big label="Wins" value={lifetimeWins} />
          <Big label="Podiums" value={lifetimePodiums} />
          <Big label="Points" value={lifetimePoints} />
          <Big
            label="Avg"
            value={counted ? `P${(positionSum / counted).toFixed(1)}` : "—"}
          />
        </div>
      </section>
    </div>
  );
}

function PositionBreakdown({
  counts,
}: {
  counts: Record<number, number>;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="bg-black/30 rounded-xl p-4 col-span-2 md:col-span-1">
      <div className="text-[10px] text-ink-mute uppercase tracking-wider mb-2">
        Finishes
      </div>
      <div className="space-y-1.5">
        {[1, 2, 3, 4].map((p) => {
          const c = counts[p] || 0;
          const pct = total > 0 ? (c / total) * 100 : 0;
          return (
            <div key={p} className="flex items-center gap-2 text-xs">
              <span className="w-6 font-mono text-ink-mute">P{p}</span>
              <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="font-bold tabular-nums w-4 text-right">{c}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Big({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-black/30 rounded-xl p-4 text-center">
      <div className="text-3xl font-black tabular-nums">{value}</div>
      <div className="text-[10px] text-ink-mute uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}
