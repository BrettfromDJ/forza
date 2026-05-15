import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getRaceWithResults,
  getSeason,
  listTeams,
} from "@/lib/queries";
import { parsePoints, teamOutcomesForRace } from "@/lib/scoring";
import { deleteRaceAction } from "@/lib/actions";
import { requireAuth } from "@/lib/auth";

export default async function RaceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const race = getRaceWithResults(Number(id));
  if (!race) notFound();
  const season = getSeason(race.season_id);
  const teams = listTeams();
  const points = season ? parsePoints(season.points_config) : [4, 3, 2, 1];
  const outcomes = teamOutcomesForRace(race, teams, points);
  const sortedResults = [...race.results].sort(
    (a, b) => a.position - b.position,
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <Link
          href={`/seasons/${race.season_id}`}
          className="text-sm text-ink-dim hover:text-ink"
        >
          ← {season?.name ?? "Season"}
        </Link>
        <h1 className="text-4xl font-black tracking-tight mt-2">
          {race.track}
        </h1>
        <div className="text-sm text-ink-dim mt-1">
          {race.race_date}
          {race.mode ? ` · ${race.mode}` : ""}
        </div>
      </div>

      {race.screenshot && (
        <div className="rounded-2xl overflow-hidden border border-line/60 bg-black">
          <img
            src={`/api/uploads/${race.screenshot}`}
            alt="Race screenshot"
            className="w-full max-h-[60vh] object-contain"
          />
        </div>
      )}

      <section className="grid md:grid-cols-2 gap-3">
        {outcomes
          .map((o) => ({ ...o, team: teams.find((t) => t.id === o.teamId)! }))
          .sort((a, b) => b.points - a.points)
          .map((o, idx) => (
            <div
              key={o.teamId}
              className="rounded-2xl border border-line/60 p-5 relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${o.team.color}22, transparent 60%)` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-ink-mute font-mono">
                    {idx === 0 && o.points > (outcomes[1]?.points ?? -1)
                      ? "WINNER"
                      : "RESULT"}
                  </div>
                  <div className="text-2xl font-black">{o.team.name}</div>
                  <div className="text-sm text-ink-dim mt-1">
                    {o.team.player1.name} & {o.team.player2.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-black tabular-nums">
                    {o.points}
                  </div>
                  <div className="text-[10px] text-ink-mute uppercase">pts</div>
                </div>
              </div>
              <div className="text-xs text-ink-mute mt-3">
                Finishes: {o.positions.sort((a, b) => a - b).map((p) => `P${p}`).join(" · ")}
              </div>
            </div>
          ))}
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-[0.2em] text-ink-mute font-bold mb-3">
          Finishing order
        </h2>
        <div className="bg-surface rounded-2xl border border-line/60 overflow-hidden">
          {sortedResults.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center gap-4 p-4 ${
                i < sortedResults.length - 1 ? "border-b border-line/40" : ""
              }`}
            >
              <div className="w-10 text-2xl font-black tabular-nums text-center">
                {r.position}
              </div>
              <span
                className="w-1.5 h-10 rounded-sm"
                style={{ background: r.player.color }}
              />
              <div className="flex-1">
                <div className="font-bold">{r.player.name}</div>
                {r.dnf ? (
                  <div className="text-xs text-bad uppercase tracking-wider font-bold">
                    DNF
                  </div>
                ) : null}
              </div>
              <div className="text-right">
                <div className="font-black tabular-nums">
                  {r.dnf ? 0 : points[r.position - 1] ?? 0}
                </div>
                <div className="text-[10px] text-ink-mute uppercase">pts</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {race.notes && (
        <section>
          <h2 className="text-sm uppercase tracking-[0.2em] text-ink-mute font-bold mb-2">
            Notes
          </h2>
          <div className="bg-surface rounded-2xl border border-line/60 p-5 whitespace-pre-wrap text-ink-dim">
            {race.notes}
          </div>
        </section>
      )}

      <form action={deleteRaceAction} className="flex justify-end">
        <input type="hidden" name="id" value={race.id} />
        <button className="text-sm px-4 py-2 rounded-full border border-bad/40 text-bad hover:bg-bad/10">
          Delete race
        </button>
      </form>
    </div>
  );
}
