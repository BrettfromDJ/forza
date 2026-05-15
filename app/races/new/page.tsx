import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getActiveSeason,
  isSetupComplete,
  listPlayers,
  listSeasons,
  listTeams,
} from "@/lib/queries";
import { logRaceAction } from "@/lib/actions";
import { RacePicker } from "@/components/RacePicker";
import { requireAuth } from "@/lib/auth";

export default async function NewRacePage() {
  if (!isSetupComplete()) redirect("/setup");
  await requireAuth();
  const seasons = listSeasons();
  if (seasons.length === 0) redirect("/seasons/new");

  const active = getActiveSeason();
  const players = listPlayers();
  const teams = listTeams();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/" className="text-sm text-ink-dim hover:text-ink">
        ← Home
      </Link>
      <h1 className="text-4xl font-black tracking-tight mt-2 mb-6">
        Log a race
      </h1>

      <form action={logRaceAction} className="space-y-8">
        <section className="bg-surface rounded-2xl border border-line/60 p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Season">
              <select
                name="season_id"
                required
                defaultValue={active?.id || seasons[0].id}
                className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.status === "active" ? " · active" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                type="date"
                name="race_date"
                defaultValue={today}
                className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5"
              />
            </Field>
            <Field label="Track">
              <input
                name="track"
                placeholder="Maple Valley Long"
                required
                className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5 outline-none focus:border-accent"
              />
            </Field>
            <Field label="Mode (optional)">
              <input
                name="mode"
                placeholder="Circuit / Sprint / Drift"
                className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5"
              />
            </Field>
          </div>
        </section>

        <section className="bg-surface rounded-2xl border border-line/60 p-6">
          <h2 className="font-bold tracking-wide text-sm text-ink-dim uppercase mb-4">
            Finishing order
          </h2>
          <RacePicker players={players} teams={teams} />
        </section>

        <section className="bg-surface rounded-2xl border border-line/60 p-6 space-y-4">
          <Field label="Screenshot (optional)">
            <input
              type="file"
              name="screenshot"
              accept="image/*"
              className="block text-sm text-ink-dim file:mr-3 file:rounded-full file:border-0 file:bg-accent file:text-white file:px-4 file:py-2 file:font-semibold hover:file:brightness-110"
            />
            <div className="text-xs text-ink-mute mt-1">
              PNG/JPG/WEBP/GIF, up to 10MB.
            </div>
          </Field>
          <Field label="Notes (optional)">
            <textarea
              name="notes"
              rows={3}
              placeholder="Anything memorable? Lap times, drama, photo finish…"
              className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5 outline-none focus:border-accent"
            />
          </Field>
        </section>

        <div className="flex justify-end gap-2">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-full text-ink-dim hover:text-ink"
          >
            Cancel
          </Link>
          <button className="bg-accent hover:brightness-110 px-6 py-2.5 rounded-full font-semibold text-white">
            Save race
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-ink-dim font-bold mb-1.5">
        {label}
      </div>
      {children}
    </label>
  );
}
