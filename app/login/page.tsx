import { redirect } from "next/navigation";
import { loginAction } from "@/lib/actions";
import { getCurrentUser, hasAnyPlayers } from "@/lib/auth";
import { listPlayers } from "@/lib/queries";

export default async function LoginPage() {
  if (!hasAnyPlayers()) redirect("/setup");
  const me = await getCurrentUser();
  if (me) redirect("/");

  const players = listPlayers();

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="checker w-12 h-12 rounded-sm mx-auto mb-4" />
        <h1 className="text-3xl font-black tracking-tight">Pick your driver</h1>
        <p className="text-ink-dim text-sm mt-2">
          Tap your name to jump in.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {players.map((p) => (
          <form key={p.id} action={loginAction}>
            <input type="hidden" name="player_id" value={p.id} />
            <button
              className="w-full text-left rounded-2xl border-2 border-line bg-surface p-5 hover:border-accent hover:bg-accent/5 transition group"
            >
              <span
                className="block w-3 h-3 rounded-full mb-3"
                style={{ background: p.color }}
              />
              <div className="font-bold text-lg">{p.name}</div>
              <div className="text-[10px] text-ink-mute uppercase tracking-wider mt-1 group-hover:text-accent">
                Tap to drive in →
              </div>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
