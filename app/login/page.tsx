import { redirect } from "next/navigation";
import { loginAction } from "@/lib/actions";
import { getCurrentUser, hasAnyPlayers } from "@/lib/auth";
import { listPlayers } from "@/lib/queries";
import Link from "next/link";

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
          Tap your name, enter your password if you set one.
        </p>
      </div>

      <form action={loginAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {players.map((p, idx) => (
            <label
              key={p.id}
              className="cursor-pointer relative"
            >
              <input
                type="radio"
                name="player_id"
                value={p.id}
                defaultChecked={idx === 0}
                className="peer sr-only"
                required
              />
              <div
                className="rounded-2xl border-2 p-4 transition peer-checked:border-accent peer-checked:bg-accent/10 border-line bg-surface"
              >
                <span
                  className="block w-3 h-3 rounded-full mb-2"
                  style={{ background: p.color }}
                />
                <div className="font-bold">{p.name}</div>
                <div className="text-[10px] text-ink-mute uppercase tracking-wider mt-0.5">
                  {p.password_hash ? "Password protected" : "No password"}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-ink-dim font-bold mb-1.5">
            Password
          </div>
          <input
            type="password"
            name="password"
            placeholder="Leave blank if you have no password"
            className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5 outline-none focus:border-accent"
            autoComplete="current-password"
          />
        </div>

        <button className="w-full bg-accent hover:brightness-110 px-6 py-3 rounded-full font-semibold text-white">
          Drive in
        </button>

        <div className="text-xs text-center text-ink-mute pt-4">
          League admin? <Link href="/setup" className="underline">Setup &amp; passwords</Link>
        </div>
      </form>
    </div>
  );
}
