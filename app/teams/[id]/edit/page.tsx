import Link from "next/link";
import { notFound } from "next/navigation";
import { editTeamAction } from "@/lib/actions";
import { getTeam } from "@/lib/queries";

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = getTeam(Number(id));
  if (!team) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/teams/${team.id}`}
        className="text-sm text-ink-dim hover:text-ink"
      >
        ← {team.name}
      </Link>
      <h1 className="text-4xl font-black tracking-tight mt-2 mb-6">
        Edit team
      </h1>

      <form action={editTeamAction} className="space-y-6">
        <input type="hidden" name="id" value={team.id} />

        <div className="bg-surface rounded-2xl border border-line/60 p-6 space-y-4">
          <Field label="Name">
            <input
              name="name"
              defaultValue={team.name}
              required
              className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5 outline-none focus:border-accent"
            />
          </Field>

          <Field label="Color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="color"
                defaultValue={team.color}
                className="w-14 h-14 rounded bg-transparent cursor-pointer"
              />
              <div className="text-sm text-ink-dim">
                {team.player1.name} & {team.player2.name}
              </div>
            </div>
          </Field>
        </div>

        <div className="bg-surface/60 rounded-2xl border border-line/60 border-dashed p-5 text-sm text-ink-dim">
          Need to swap drivers between teams or rename a driver?{" "}
          <Link
            href="/setup"
            className="text-ink underline hover:text-ink-dim"
          >
            Open league setup
          </Link>
          .
        </div>

        <div className="flex justify-end gap-2">
          <Link
            href={`/teams/${team.id}`}
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
