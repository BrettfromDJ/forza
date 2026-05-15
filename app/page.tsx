import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  getActiveSeason,
  isSetupComplete,
  listRacesWithResults,
  listSeasons,
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
import { buildActivityFeed } from "@/lib/feed";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function HomePage() {
  if (!isSetupComplete()) redirect("/setup");
  await requireAuth();

  const season = getActiveSeason();
  const teams = listTeams();
  const players = listPlayers();

  if (!season) {
    return (
      <EmptyHero
        title="No active season"
        body="Kick things off by creating your first season. Pick a name, optionally tweak the points, and start logging."
        cta={{ href: "/seasons/new", label: "Create season" }}
      />
    );
  }

  const points = parsePoints(season.points_config);
  const races = listRacesWithResults(season.id);
  const teamStats = computeTeamSeasonStats(races, teams, points);
  const playerStats = computePlayerSeasonStats(
    races,
    points,
    players.map((p) => p.id),
  );

  const allSeasons = listSeasons();
  const racesBySeason: Record<number, typeof races> = {};
  for (const s of allSeasons) {
    racesBySeason[s.id] = s.id === season.id ? races : listRacesWithResults(s.id);
  }
  const feed = buildActivityFeed({
    players,
    teams,
    seasons: allSeasons,
    racesBySeason,
  });

  return (
    <div className="space-y-10">
      <AutoRefresh />
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-ink-mute">
              Current season
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              {season.name}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href={`/seasons/${season.id}/calendar`}
              className="text-ink-dim hover:text-ink"
            >
              Calendar →
            </Link>
            <Link
              href={`/seasons/${season.id}`}
              className="text-ink-dim hover:text-ink"
            >
              Season detail →
            </Link>
          </div>
        </div>
        <StandingsScoreboard stats={teamStats} />
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionHeader
            title="Recent races"
            action={
              <Link
                href="/races/new"
                className="text-sm text-accent hover:brightness-110"
              >
                + Log race
              </Link>
            }
          />
          {races.length === 0 ? (
            <div className="bg-surface border border-line/60 border-dashed rounded-2xl p-10 text-center">
              <div className="text-ink-dim mb-4">
                No races yet. Run a race, log it, and the standings will come alive.
              </div>
              <Link
                href="/races/new"
                className="inline-flex bg-accent hover:brightness-110 px-5 py-2.5 rounded-full font-semibold text-white text-sm"
              >
                Log first race
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {races.slice(0, 6).map((race) => (
                <RaceCard
                  key={race.id}
                  race={race}
                  teams={teams}
                  pointsConfig={points}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <SectionHeader title="Activity" />
            <ActivityFeed items={feed} limit={8} />
          </div>

          <div>
            <SectionHeader title="Drivers" />
          <div className="space-y-2">
            {[...players]
              .sort((a, b) => {
                const sa = playerStats.find((x) => x.playerId === a.id)!;
                const sb = playerStats.find((x) => x.playerId === b.id)!;
                if (sb.totalPoints !== sa.totalPoints) return sb.totalPoints - sa.totalPoints;
                const ap = sa.avgPosition ?? 99;
                const bp = sb.avgPosition ?? 99;
                return ap - bp;
              })
              .map((p) => {
              const s = playerStats.find((x) => x.playerId === p.id)!;
              return (
                <Link
                  key={p.id}
                  href={`/players/${p.id}`}
                  className="flex items-center justify-between bg-surface hover:bg-surface-2 transition border border-line/60 rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2 h-10 rounded-sm"
                      style={{ background: p.color }}
                    />
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs text-ink-mute">
                        {s.races} races · avg P
                        {s.avgPosition ? s.avgPosition.toFixed(1) : "—"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xl tabular-nums">
                      {s.totalPoints}
                    </div>
                    <div className="text-[10px] text-ink-mute uppercase">
                      pts
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm uppercase tracking-[0.2em] text-ink-mute font-bold">
        {title}
      </h2>
      {action}
    </div>
  );
}

function EmptyHero({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="rounded-3xl border border-line/60 bg-surface p-12 text-center diagonal-stripes">
      <h1 className="text-3xl font-black mb-2">{title}</h1>
      <p className="text-ink-dim max-w-md mx-auto mb-6">{body}</p>
      <Link
        href={cta.href}
        className="inline-flex bg-accent hover:brightness-110 px-6 py-3 rounded-full font-semibold text-white"
      >
        {cta.label}
      </Link>
    </div>
  );
}
