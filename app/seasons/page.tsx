import Link from "next/link";
import { listSeasons, listRaces, isSetupComplete } from "@/lib/queries";
import { redirect } from "next/navigation";
import { activateSeasonAction } from "@/lib/actions";
import { parsePoints } from "@/lib/scoring";

export default function SeasonsPage() {
  if (!isSetupComplete()) redirect("/setup");
  const seasons = listSeasons();

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Seasons</h1>
          <p className="text-ink-dim mt-1">
            Each season has its own standings and points scheme.
          </p>
        </div>
        <Link
          href="/seasons/new"
          className="bg-accent hover:brightness-110 px-5 py-2.5 rounded-full font-semibold text-white text-sm"
        >
          + New season
        </Link>
      </div>

      {seasons.length === 0 ? (
        <div className="bg-surface border border-line/60 border-dashed rounded-2xl p-10 text-center text-ink-dim">
          No seasons yet.
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map((s) => {
            const raceCount = listRaces(s.id).length;
            const points = parsePoints(s.points_config);
            return (
              <div
                key={s.id}
                className="bg-surface hover:bg-surface-2 border border-line/60 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <Link href={`/seasons/${s.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-lg">{s.name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="text-xs text-ink-mute mt-1">
                    {raceCount} race{raceCount === 1 ? "" : "s"} · points{" "}
                    {points.join("-")}
                    {s.start_date ? ` · ${s.start_date}` : ""}
                    {s.end_date ? ` → ${s.end_date}` : ""}
                  </div>
                </Link>
                <Link
                  href={`/seasons/${s.id}/edit`}
                  className="text-xs px-3 py-1.5 rounded-full border border-line hover:border-ink-dim text-ink-dim hover:text-ink"
                >
                  Edit
                </Link>
                {s.status !== "active" && (
                  <form action={activateSeasonAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-xs px-3 py-1.5 rounded-full border border-line hover:border-ink-dim text-ink-dim hover:text-ink">
                      Set active
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-good/20 text-good",
    upcoming: "bg-accent-2/20 text-accent-2",
    completed: "bg-ink-mute/20 text-ink-dim",
  };
  return (
    <span
      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
        map[status] || ""
      }`}
    >
      {status}
    </span>
  );
}
