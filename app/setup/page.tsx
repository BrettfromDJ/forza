import { setupAction } from "@/lib/actions";
import { isSetupComplete, listPlayers, listTeams } from "@/lib/queries";
import Link from "next/link";

export default function SetupPage() {
  const done = isSetupComplete();
  const existingPlayers = listPlayers();
  const existingTeams = listTeams();

  const defaults = [
    { name: existingPlayers[0]?.name || "", color: existingPlayers[0]?.color || "#e10600" },
    { name: existingPlayers[1]?.name || "", color: existingPlayers[1]?.color || "#1e90ff" },
    { name: existingPlayers[2]?.name || "", color: existingPlayers[2]?.color || "#2ecc71" },
    { name: existingPlayers[3]?.name || "", color: existingPlayers[3]?.color || "#ffd400" },
  ];
  const teamDefaults = [
    {
      name: existingTeams[0]?.name || "Team Apex",
      color: existingTeams[0]?.color || "#e10600",
      p1: existingTeams[0]?.player1_id || 1,
      p2: existingTeams[0]?.player2_id || 2,
    },
    {
      name: existingTeams[1]?.name || "Team Drift",
      color: existingTeams[1]?.color || "#1e90ff",
      p1: existingTeams[1]?.player1_id || 3,
      p2: existingTeams[1]?.player2_id || 4,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-2">
          {done ? "League setup" : "Welcome to your garage"}
        </h1>
        <p className="text-ink-dim">
          Add the four drivers and lock in your two permanent teams. You can
          rename them later.
        </p>
      </div>

      <form action={setupAction} className="space-y-8">
        <section className="bg-surface rounded-2xl border border-line/60 p-6">
          <h2 className="font-bold tracking-wide text-sm text-ink-dim uppercase mb-4">
            Drivers
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-ink-mute font-mono w-6">P{i}</span>
                <input
                  name={`p${i}_name`}
                  defaultValue={defaults[i - 1].name}
                  placeholder={`Driver ${i}`}
                  className="flex-1 bg-surface-2 border border-line rounded-lg px-3 py-2 outline-none focus:border-accent"
                />
                <input
                  type="color"
                  name={`p${i}_color`}
                  defaultValue={defaults[i - 1].color}
                  className="w-10 h-10 rounded bg-transparent cursor-pointer"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface rounded-2xl border border-line/60 p-6">
          <h2 className="font-bold tracking-wide text-sm text-ink-dim uppercase mb-4">
            Teams
          </h2>
          <p className="text-xs text-ink-mute mb-4">
            Choose the player IDs (1-4 in the order above) for each team.
          </p>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-center"
              >
                <input
                  name={`t${i}_name`}
                  defaultValue={teamDefaults[i - 1].name}
                  placeholder={`Team ${i} name`}
                  className="bg-surface-2 border border-line rounded-lg px-3 py-2 outline-none focus:border-accent"
                />
                <select
                  name={`t${i}_p1`}
                  defaultValue={teamDefaults[i - 1].p1}
                  className="bg-surface-2 border border-line rounded-lg px-3 py-2"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      P{n}
                    </option>
                  ))}
                </select>
                <select
                  name={`t${i}_p2`}
                  defaultValue={teamDefaults[i - 1].p2}
                  className="bg-surface-2 border border-line rounded-lg px-3 py-2"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      P{n}
                    </option>
                  ))}
                </select>
                <input
                  type="color"
                  name={`t${i}_color`}
                  defaultValue={teamDefaults[i - 1].color}
                  className="w-10 h-10 rounded bg-transparent cursor-pointer"
                />
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between">
          {done ? (
            <Link href="/" className="text-ink-dim hover:text-ink text-sm">
              ← Back
            </Link>
          ) : (
            <span />
          )}
          <button className="bg-accent hover:brightness-110 transition px-6 py-3 rounded-full font-semibold text-white">
            {done ? "Save changes" : "Start the league"}
          </button>
        </div>
      </form>
    </div>
  );
}
