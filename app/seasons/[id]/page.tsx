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
  parsePoints,
} from "@/lib/scoring";
import { StandingsScoreboard } from "@/components/Standings";
import { RaceCard } from "@/components/RaceCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AutoRefresh } from "@/components/AutoRefresh";
import { SeasonActionsMenu } from "@/components/SeasonActionsMenu";
import { buildActivityFeed } from "@/lib/feed";

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
  const feed = buildActivityFeed({
    players,
    teams,
    seasons: [season],
    racesBySeason: { [season.id]: races },
  });

  const sortedDrivers = [...playerStats].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return (a.avgPosition || 99) - (b.avgPosition || 99);
  });

  return (
    <div className="space-y-10">
      <AutoRefresh />
      <div>
        <Link href="/seasons" className="text-sm text-ink-dim hover:text-ink">
          ← Seasons
        </Link>
        <div className="flex items-end justify-between gap-3 mt-2">
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
          <SeasonActionsMenu
            seasonId={season.id}
            seasonName={season.name}
            status={season.status}
          />
        </div>
      </div>

      <StandingsScoreboard stats={teamStats} />

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
          <SectionHeader title="Driver standings" />
          <div className="space-y-2">
            {sortedDrivers.map((s, idx) => {
              const p = players.find((x) => x.id === s.playerId)!;
              return (
                <Link
                  key={p.id}
                  href={`/players/${p.id}`}
                  className="flex items-center justify-between bg-surface hover:bg-surface-2 border border-line/60 rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm w-5 text-center">
                      {idx === 0 ? "🏆" : <span className="text-ink-mute">{idx + 1}</span>}
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

          <div className="mt-6">
            <SectionHeader title="Activity" />
            <ActivityFeed items={feed} limit={10} />
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
