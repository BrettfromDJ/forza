import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSeason,
  listRacesWithResults,
  listTeams,
} from "@/lib/queries";
import { parsePoints, teamOutcomesForRace } from "@/lib/scoring";

export default async function SeasonCalendar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const season = getSeason(Number(id));
  if (!season) notFound();
  const teams = listTeams();
  const points = parsePoints(season.points_config);
  // listRacesWithResults returns races sorted DESC; calendar wants ASC
  const races = listRacesWithResults(season.id)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.race_date).getTime() - new Date(b.race_date).getTime() ||
        a.id - b.id,
    );

  const total = season.regular_season_races;
  const completed = Math.min(races.length, total);
  const overflow = races.length - total; // post-regular-season races
  const remaining = Math.max(0, total - races.length);
  const slots = Array.from({ length: total }).map((_, i) => races[i] ?? null);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/seasons/${season.id}`}
          className="text-sm text-ink-dim hover:text-ink"
        >
          ← {season.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-ink-mute">
              Calendar
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              {season.name}
            </h1>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black tabular-nums">
              {completed}
              <span className="text-ink-mute">/{total}</span>
            </div>
            <div className="text-xs text-ink-mute uppercase tracking-wider">
              races complete
            </div>
          </div>
        </div>
        <ProgressBar value={completed} total={total} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map((race, idx) => {
          const round = idx + 1;
          if (!race)
            return (
              <EmptyRound key={`empty-${round}`} round={round} total={total} />
            );
          const outcomes = teamOutcomesForRace(race, teams, points);
          const sorted = [...outcomes].sort((a, b) => b.points - a.points);
          const winnerTeam =
            sorted.length > 1 && sorted[0].points > sorted[1].points
              ? teams.find((t) => t.id === sorted[0].teamId)
              : null;
          const podium = race.results.slice().sort((a, b) => a.position - b.position);
          return (
            <Link
              key={race.id}
              href={`/races/${race.id}`}
              className="group block rounded-2xl border border-line/60 hover:border-line bg-surface hover:bg-surface-2 transition overflow-hidden relative"
            >
              {race.screenshot ? (
                <div
                  className="h-32 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('/api/uploads/${race.screenshot}')`,
                  }}
                  aria-hidden
                />
              ) : (
                <div className="h-32 race-grid" aria-hidden />
              )}
              <div
                className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-black/70 backdrop-blur"
              >
                Round {round}
              </div>
              {winnerTeam && (
                <div
                  className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                  style={{ background: winnerTeam.color, color: "#000" }}
                >
                  {winnerTeam.name}
                </div>
              )}
              <div className="p-4">
                <div className="font-bold truncate">{race.track}</div>
                <div className="text-xs text-ink-mute mt-0.5">
                  {race.race_date}
                  {race.mode ? ` · ${race.mode}` : ""}
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  {podium.map((r) => (
                    <div
                      key={r.id}
                      className="flex-1 text-center text-[10px] uppercase tracking-wider rounded bg-black/30 py-1"
                      title={`${r.player.name} P${r.position}${r.dnf ? " DNF" : ""}`}
                    >
                      <div className="font-mono text-ink-mute">
                        P{r.position}
                      </div>
                      <div
                        className="font-bold truncate"
                        style={{ color: r.player.color }}
                      >
                        {r.player.name.split(" ")[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {overflow > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-[0.2em] text-ink-mute font-bold mb-3">
            Bonus rounds (beyond regular season)
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {races.slice(total).map((race, idx) => (
              <Link
                key={race.id}
                href={`/races/${race.id}`}
                className="rounded-2xl border border-line/60 border-dashed bg-surface p-4 hover:bg-surface-2 transition"
              >
                <div className="text-[10px] font-black uppercase tracking-wider text-accent-2">
                  +{idx + 1}
                </div>
                <div className="font-bold truncate">{race.track}</div>
                <div className="text-xs text-ink-mute mt-0.5">
                  {race.race_date}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {remaining > 0 && (
        <div className="text-sm text-ink-mute text-center">
          {remaining} round{remaining === 1 ? "" : "s"} left to race.
        </div>
      )}
    </div>
  );
}

function EmptyRound({ round, total }: { round: number; total: number }) {
  return (
    <div className="rounded-2xl border border-line/40 border-dashed bg-surface/40 p-5 min-h-[16rem] flex flex-col">
      <div className="text-[10px] font-black uppercase tracking-wider text-ink-mute">
        Round {round}
        <span className="text-ink-mute">/{total}</span>
      </div>
      <div className="flex-1 flex items-center justify-center text-ink-mute text-sm">
        Awaiting race
      </div>
    </div>
  );
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="mt-4 h-2 w-full bg-surface-2 rounded-full overflow-hidden">
      <div
        className="h-full bg-accent transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
