import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getActiveSeason,
  getTeam,
  listRacesWithResults,
  listSeasons,
  listTeams,
} from "@/lib/queries";
import {
  computeTeamSeasonStats,
  parsePoints,
  teamOutcomesForRace,
} from "@/lib/scoring";
import { requireAuth } from "@/lib/auth";

export default async function TeamDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const team = getTeam(Number(id));
  if (!team) notFound();
  const teams = listTeams();
  const seasons = listSeasons();
  const active = getActiveSeason() ?? seasons[0];

  const allRaces = seasons.flatMap((s) =>
    listRacesWithResults(s.id).map((r) => ({
      race: r,
      points: parsePoints(s.points_config),
      seasonName: s.name,
    })),
  );

  let lifetimeRaces = 0;
  let lifetimeWins = 0;
  let lifetimePoints = 0;
  const trackWins: Record<string, number> = {};

  for (const { race, points } of allRaces) {
    const outcomes = teamOutcomesForRace(race, teams, points);
    const us = outcomes.find((o) => o.teamId === team.id);
    if (!us || us.positions.length === 0) continue;
    lifetimeRaces++;
    lifetimePoints += us.points;
    const opp = outcomes.find((o) => o.teamId !== team.id);
    if (opp && us.points > opp.points) {
      lifetimeWins++;
      trackWins[race.track] = (trackWins[race.track] || 0) + 1;
    }
  }

  const seasonStats = active
    ? computeTeamSeasonStats(
        listRacesWithResults(active.id),
        teams,
        parsePoints(active.points_config),
      ).find((s) => s.team.id === team.id)
    : undefined;

  const opponent = teams.find((t) => t.id !== team.id);
  const h2h = { wins: 0, losses: 0, ties: 0 };
  for (const { race, points } of allRaces) {
    const outcomes = teamOutcomesForRace(race, teams, points);
    const us = outcomes.find((o) => o.teamId === team.id);
    const them = outcomes.find((o) => o.teamId !== team.id);
    if (!us || !them || us.positions.length === 0) continue;
    if (us.points > them.points) h2h.wins++;
    else if (us.points < them.points) h2h.losses++;
    else h2h.ties++;
  }

  const bestTrack = Object.entries(trackWins).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-8">
      <div>
        <Link href="/teams" className="text-sm text-ink-dim hover:text-ink">
          ← Teams
        </Link>
        <div className="mt-3 rounded-3xl p-8 relative overflow-hidden border border-line/60"
          style={{
            background: `linear-gradient(135deg, ${team.color}33, transparent 70%), var(--color-surface)`,
          }}
        >
          <Link
            href={`/teams/${team.id}/edit`}
            className="absolute top-5 right-5 text-sm px-4 py-2 rounded-full border border-line bg-black/30 hover:border-ink-dim"
          >
            Edit
          </Link>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-mute">
            Team
          </div>
          <h1 className="text-5xl font-black tracking-tight mt-1">
            {team.name}
          </h1>
          <div className="flex gap-3 mt-3 flex-wrap">
            <Link
              href={`/players/${team.player1.id}`}
              className="px-3 py-1.5 rounded-full bg-black/30 hover:bg-black/50 text-sm"
            >
              {team.player1.name}
            </Link>
            <Link
              href={`/players/${team.player2.id}`}
              className="px-3 py-1.5 rounded-full bg-black/30 hover:bg-black/50 text-sm"
            >
              {team.player2.name}
            </Link>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-sm uppercase tracking-[0.2em] text-ink-mute font-bold mb-3">
          {active ? `${active.name} stats` : "Active season"}
        </h2>
        {seasonStats && seasonStats.races > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Big label="Points" value={seasonStats.totalPoints} />
            <Big label="Race wins" value={seasonStats.raceWins} />
            <Big label="1-2 finishes" value={seasonStats.oneTwo} />
            <Big
              label="Avg points"
              value={seasonStats.avgPoints.toFixed(1)}
            />
            <Big label="Races" value={seasonStats.races} />
            <Big label="Double podiums" value={seasonStats.doublePodiums} />
            <Big
              label="Best finish"
              value={seasonStats.bestFinish < 99 ? `P${seasonStats.bestFinish}` : "—"}
            />
            <Big label="Ties" value={seasonStats.raceTies} />
          </div>
        ) : (
          <div className="bg-surface border border-line/60 border-dashed rounded-2xl p-8 text-center text-ink-dim">
            No races logged in this season yet.
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl border border-line/60 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-mute font-bold mb-3">
            All-time
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Big label="Races" value={lifetimeRaces} />
            <Big label="Wins" value={lifetimeWins} />
            <Big label="Points" value={lifetimePoints} />
          </div>
          {bestTrack && (
            <div className="mt-4 text-sm text-ink-dim">
              Best track:{" "}
              <span className="text-ink font-semibold">{bestTrack[0]}</span> ·{" "}
              {bestTrack[1]} win{bestTrack[1] === 1 ? "" : "s"}
            </div>
          )}
        </div>
        {opponent && (
          <div className="bg-surface rounded-2xl border border-line/60 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-ink-mute font-bold mb-3">
              Head to head vs {opponent.name}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-12 rounded-lg overflow-hidden bg-surface-2 flex">
                <Bar
                  pct={pct(h2h.wins, h2h.wins + h2h.losses + h2h.ties)}
                  color={team.color}
                  label={`${h2h.wins}W`}
                />
                <Bar
                  pct={pct(h2h.ties, h2h.wins + h2h.losses + h2h.ties)}
                  color="#444"
                  label={h2h.ties ? `${h2h.ties}T` : ""}
                />
                <Bar
                  pct={pct(h2h.losses, h2h.wins + h2h.losses + h2h.ties)}
                  color={opponent.color}
                  label={`${h2h.losses}L`}
                />
              </div>
            </div>
            <div className="text-sm text-ink-dim mt-3">
              {h2h.wins + h2h.losses + h2h.ties === 0
                ? "No races yet."
                : `${h2h.wins} - ${h2h.ties} - ${h2h.losses} across all seasons.`}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function pct(n: number, d: number) {
  return d > 0 ? (n / d) * 100 : 0;
}

function Bar({
  pct,
  color,
  label,
}: {
  pct: number;
  color: string;
  label: string;
}) {
  if (pct <= 0) return null;
  return (
    <div
      className="h-full flex items-center justify-center text-xs font-bold text-white/90"
      style={{ width: `${pct}%`, background: color }}
    >
      {pct > 8 && label}
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
