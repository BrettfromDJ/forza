import Link from "next/link";
import { notFound } from "next/navigation";
import { editSeasonAction } from "@/lib/actions";
import { getSeason } from "@/lib/queries";
import { parsePoints } from "@/lib/scoring";

export default async function EditSeasonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const season = getSeason(Number(id));
  if (!season) notFound();
  const points = parsePoints(season.points_config);

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/seasons/${season.id}`}
        className="text-sm text-ink-dim hover:text-ink"
      >
        ← {season.name}
      </Link>
      <h1 className="text-4xl font-black tracking-tight mt-2 mb-6">
        Edit season
      </h1>

      <form action={editSeasonAction} className="space-y-6">
        <input type="hidden" name="id" value={season.id} />

        <Field label="Name">
          <input
            name="name"
            defaultValue={season.name}
            required
            className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5 outline-none focus:border-accent"
          />
        </Field>

        <Field
          label="Points per finishing position"
          hint="Editing this re-scores every race in this season."
        >
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-mute font-mono">
                  P{i}
                </span>
                <input
                  type="number"
                  name={`p${i}`}
                  defaultValue={points[i - 1]}
                  min={0}
                  className="w-full bg-surface-2 border border-line rounded-lg pl-9 pr-3 py-2.5 tabular-nums outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>
        </Field>

        <Field
          label="Regular-season races"
          hint="How many rounds make up the season calendar."
        >
          <input
            type="number"
            name="regular_season_races"
            defaultValue={season.regular_season_races}
            min={1}
            max={100}
            className="w-32 bg-surface-2 border border-line rounded-lg px-3 py-2.5 tabular-nums outline-none focus:border-accent"
          />
        </Field>

        <Field label="Status">
          <select
            name="status"
            defaultValue={season.status}
            className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5"
          >
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
          <div className="text-xs text-ink-mute mt-1">
            Setting active will mark any other active season as completed.
          </div>
        </Field>

        <div className="flex justify-end gap-2">
          <Link
            href={`/seasons/${season.id}`}
            className="px-5 py-2.5 rounded-full text-ink-dim hover:text-ink"
          >
            Cancel
          </Link>
          <button className="bg-accent hover:brightness-110 px-6 py-2.5 rounded-full font-semibold text-white">
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-ink-dim font-bold mb-1.5">
        {label}
      </div>
      {children}
      {hint && <div className="text-xs text-ink-mute mt-1">{hint}</div>}
    </label>
  );
}
