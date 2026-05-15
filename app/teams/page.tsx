import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getActiveSeason,
  isSetupComplete,
  listRacesWithResults,
  listTeams,
} from "@/lib/queries";
import {
  computeTeamSeasonStats,
  parsePoints,
} from "@/lib/scoring";
import { requireAuth } from "@/lib/auth";

export default async function TeamsPage() {
  if (!isSetupComplete()) redirect("/setup");
  await requireAuth();
  const teams = listTeams();
  const active = getActiveSeason();
  const points = active ? parsePoints(active.points_config) : [4, 3, 2, 1];
  const races = active ? listRacesWithResults(active.id) : [];
  const stats = computeTeamSeasonStats(races, teams, points);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Teams</h1>
        <p className="text-ink-dim mt-1">
          {active
            ? `Showing stats for ${active.name}.`
            : "Permanent teams. Stats appear once you have an active season."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {teams.map((t) => {
          const s = stats.find((x) => x.team.id === t.id);
          return (
            <Link
              key={t.id}
              href={`/teams/${t.id}`}
              className="rounded-2xl border border-line/60 hover:border-line p-6 bg-surface hover:bg-surface-2 transition relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: t.color }}
              />
              <div className="text-2xl font-black">{t.name}</div>
              <div className="text-sm text-ink-dim mt-1">
                {t.player1.name} & {t.player2.name}
              </div>
              {s && (
                <div className="grid grid-cols-4 gap-2 mt-5 text-center">
                  <Mini label="Pts" value={s.totalPoints} />
                  <Mini label="W" value={s.raceWins} />
                  <Mini label="1-2s" value={s.oneTwo} />
                  <Mini label="Races" value={s.races} />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="text-sm text-ink-mute">
        Need to fix names or pairings?{" "}
        <Link href="/setup" className="text-ink-dim underline hover:text-ink">
          Open league setup
        </Link>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-black/30 rounded-lg py-2">
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-ink-mute uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
