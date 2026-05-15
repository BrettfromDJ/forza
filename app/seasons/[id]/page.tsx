import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  getSeason,
  listRacesWithResults,
  listTeams,
  listPlayers,
} from "@/lib/queries";
import {
  computePlayerSeasonStats,
  computeTeamSeasonStats,
  computeSeasonMVP,
  parsePoints,
} from "@/lib/scoring";
import { StandingsScoreboard } from "@/components/Standings";
import { RaceCard } from "@/components/RaceCard";
import { PointsGapChart } from "@/components/PointsGapChart";
import {
  activateSeasonAction,
  completeSeasonAction,
  deleteSeasonAction,
  resetSeasonAction,
} from "@/lib/actions";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function SeasonDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const season = getSeason(Number(id));
  if (!season) notFound();
  const teams = listTeams();
  const players = listPlayers();
  const points = parsePoints(season.points_config);
  const races = listRacesWithResults(season.id);
  const teamStats = computeTeamSeasonStats(races, teams, points);
  const playerStats = computePlayerSeasonStats(
    races,
    points,
    players.map((p) => p.id),
  );
  const mvp = computeSeasonMVP(playerStats, players);

  return (
    <div className="space-y-10">
      <div>
        <Link href="/seasons" className="text-sm text-ink-dim hover:text-ink">
          ← Seasons
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3 mt-2">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-ink-mute">
              {season.status === "active"
                ? "Active season"
                : season.status === "upcoming"
                  ? "Upcoming season"
                  : "Completed"}
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              {season.name}
            </h1>
            <div className="text-sm text-ink-dim mt-1">
              Round {Math.min(races.length, season.regular_season_races)} of{" "}
              {season.regular_season_races} · Points {points.join("-")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/seasons/${season.id}/calendar`}
              className="text-sm px-4 py-2 rounded-full border border-line hover:border-ink-dim"
            >
              Calendar
            </Link>
            <Link
              href={`/seasons/${season.id}/edit`}
              className="text-sm px-4 py-2 rounded-full border border-line hover:border-ink-dim"
            >
              Edit
            </Link>
            {season.status !== "active" && (
              <form action={activateSeasonAction}>
                <input type="hidden" name="id" value={season.id} />
                <button className="text-sm px-4 py-2 rounded-full border border-line hover:border-ink-dim">
                  Set active
                </button>
              </form>
            )}
            {season.status === "active" && (
              <form action={completeSeasonAction}>
                <input type="hidden" name="id" value={season.id} />
                <button className="text-sm px-4 py-2 rounded-full border border-line hover:border-ink-dim">
                  Mark completed
                </button>
              </form>
            )}
            <form action={resetSeasonAction}>
              <input type="hidden" name="id" value={season.id} />
              <ConfirmButton
                message={`Reset ${season.name}? This deletes every race (and screenshots) in this season but keeps the season itself. This cannot be undone.`}
                className="text-sm px-4 py-2 rounded-full border border-accent-2/50 text-accent-2 hover:bg-accent-2/10"
              >
                Reset stats
              </ConfirmButton>
            </form>
            <form action={deleteSeasonAction}>
              <input type="hidden" name="id" value={season.id} />
              <ConfirmButton
                message={`Delete ${season.name}? This permanently removes the season and every race in it. This cannot be undone.`}
                className="text-sm px-4 py-2 rounded-full border border-bad/40 text-bad hover:bg-bad/10"
              >
                Delete
              </ConfirmButton>
            </form>
          </div>
        </div>
      </div>

      <StandingsScoreboard stats={teamStats} />

      {races.length > 0 && <PointsGapChart stats={teamStats} />}

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionHeader title={`Races (${races.length})`} />
          {races.length === 0 ? (
            <div className="bg-surface border border-line/60 border-dashed rounded-2xl p-10 text-center text-ink-dim">
              No races logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {races.map((r) => (
                <RaceCard
                  key={r.id}
                  race={r}
                  teams={teams}
                  pointsConfig={points}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          {mvp && (
            <div className="mb-5">
              <SectionHeader
                title={season.status === "completed" ? "Season MVP" : "MVP so far"}
              />
              <div
                className="rounded-2xl border p-4 flex items-center gap-4"
                style={{
                  borderColor: mvp.player.color + "55",
                  background: mvp.player.color + "11",
                }}
              >
                <div
                  className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{ background: mvp.player.color + "30" }}
                >
                  🏆
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-black text-lg leading-tight"
                    style={{ color: mvp.player.color }}
                  >
                    {mvp.player.name}
                  </div>
                  <div className="text-xs text-ink-mute mt-0.5">
                    {mvp.wins} win{mvp.wins !== 1 ? "s" : ""} ·{" "}
                    {mvp.podiums} podium{mvp.podiums !== 1 ? "s" : ""} ·{" "}
                    avg P{mvp.avgPosition ? mvp.avgPosition.toFixed(1) : "—"}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-2xl tabular-nums">
                    {mvp.totalPoints}
                  </div>
                  <div className="text-[10px] text-ink-mute uppercase">pts</div>
                </div>
              </div>
            </div>
          )}

          <SectionHeader title="Driver standings" />
          <div className="space-y-2">
            {[...playerStats]
              .sort((a, b) => b.totalPoints - a.totalPoints)
              .map((s, idx) => {
                const p = players.find((x) => x.id === s.playerId)!;
                return (
                  <Link
                    key={p.id}
                    href={`/players/${p.id}`}
                    className="flex items-center justify-between bg-surface hover:bg-surface-2 border border-line/60 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-ink-mute font-mono text-sm w-5">
                        {idx + 1}
                      </span>
                      <span
                        className="w-2 h-9 rounded-sm"
                        style={{ background: p.color }}
                      />
                      <div>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-xs text-ink-mute">
                          {s.wins}W · {s.podiums}P · avg P
                          {s.avgPosition ? s.avgPosition.toFixed(1) : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-xl tabular-nums">
                        {s.totalPoints}
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-sm uppercase tracking-[0.2em] text-ink-mute font-bold mb-3">
      {title}
    </h2>
  );
}
