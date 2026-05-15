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
import { computeAchievements } from "@/lib/achievements";
import { computeDriverH2H } from "@/lib/h2h";
import { requireAuth } from "@/lib/auth";

export default async function PlayerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
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
  const racesBySeason: Record<number, ReturnType<typeof listRacesWithResults>> = {};
  for (const s of seasons) {
    const races = listRacesWithResults(s.id);
    racesBySeason[s.id] = races;
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

  const allRacesFlat = Object.values(racesBySeason).flat();
  const opponents = allPlayers.filter((p) => p.id !== player.id);
  const h2h = computeDriverH2H(
    player.id,
    opponents.map((o) => o.id),
    allRacesFlat,
  );
  const achievements = computeAchievements(player.id, seasons, racesBySeason);
  const earnedCount = achievements.filter((a) => a.earned).length;

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

      {opponents.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-[0.2em] text-ink-mute font-bold mb-3">
            Head to head (all-time)
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {h2h.map((row) => {
              const opp = opponents.find((o) => o.id === row.opponentId)!;
              const total = row.shared;
              const aheadPct = total ? (row.ahead / total) * 100 : 0;
              const behindPct = total ? (row.behind / total) * 100 : 0;
              return (
                <Link
                  key={opp.id}
                  href={`/players/${opp.id}`}
                  className="bg-surface rounded-2xl border border-line/60 hover:border-line p-4 block"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-8 rounded-sm"
                        style={{ background: opp.color }}
                      />
                      <div className="font-bold truncate">vs {opp.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black tabular-nums leading-none">
                        {row.ahead}
                        <span className="text-ink-mute text-sm">
                          -{row.behind}
                        </span>
                      </div>
                      <div className="text-[10px] text-ink-mute uppercase">
                        ahead-behind
                      </div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden flex bg-surface-2">
                    <div
                      className="h-full"
                      style={{
                        width: `${aheadPct}%`,
                        background: player.color,
                      }}
                    />
                    <div
                      className="h-full"
                      style={{
                        width: `${behindPct}%`,
                        background: opp.color,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <div className="text-xs text-ink-mute mt-2">
                    {total === 0
                      ? "No shared races yet."
                      : `${total} shared race${total === 1 ? "" : "s"}`}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-sm uppercase tracking-[0.2em] text-ink-mute font-bold">
            Achievements
          </h2>
          <div className="text-xs text-ink-mute tabular-nums">
            {earnedCount}/{achievements.length}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`flex gap-4 p-4 rounded-2xl border transition ${
                a.earned
                  ? "bg-surface border-line"
                  : "bg-surface/40 border-line/40 opacity-60"
              }`}
            >
              <div
                className={`text-3xl shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  a.earned
                    ? "bg-accent/20 ring-2 ring-accent/40"
                    : "bg-black/30 grayscale"
                }`}
              >
                {a.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold flex items-center gap-2">
                  {a.name}
                  {a.earned && (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-accent">
                      Earned
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-dim mt-0.5">
                  {a.description}
                </div>
                {a.earned && a.detail && (
                  <div className="text-[11px] text-ink-mute mt-1">
                    {a.detail}
                  </div>
                )}
                {!a.earned && a.progress && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-line rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ink-mute"
                        style={{
                          width: `${Math.min(100, (a.progress.current / a.progress.target) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-[11px] text-ink-mute mt-1 tabular-nums">
                      {a.progress.current} / {a.progress.target}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
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
