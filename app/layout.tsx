import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { isSetupComplete, getActiveSeason } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";

export const metadata: Metadata = {
  title: "Forza League",
  description: "Track your Forza races, seasons, and team standings.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setup = safe(() => isSetupComplete());
  const active = safe(() => getActiveSeason());
  const me = await safeAsync(() => getCurrentUser());

  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-line/60 bg-surface/60 backdrop-blur sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="checker w-7 h-7 rounded-sm" />
              <span className="text-xl font-black tracking-tight">
                FORZA<span className="text-accent">.</span>LEAGUE
              </span>
            </Link>
            {setup && me ? (
              <nav className="flex items-center gap-1 text-sm">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/seasons">Seasons</NavLink>
                <NavLink href="/teams">Teams</NavLink>
                <Link
                  href={`/players/${me.id}`}
                  className="px-3 py-2 rounded-md hover:bg-surface-2 text-ink flex items-center gap-2"
                  title="Your driver page"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: me.color }}
                  />
                  <span className="font-semibold">{me.name}</span>
                </Link>
                <form action={logoutAction}>
                  <button
                    className="px-3 py-2 rounded-md text-ink-mute hover:text-ink"
                    title="Log out"
                  >
                    Log out
                  </button>
                </form>
                {active && (
                  <Link
                    href="/races/new"
                    className="ml-2 inline-flex items-center gap-2 bg-accent hover:brightness-110 transition px-4 py-2 rounded-full font-semibold text-sm text-white"
                  >
                    <span className="text-lg leading-none">+</span> Log race
                  </Link>
                )}
              </nav>
            ) : null}
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-5 py-8">{children}</main>
        <footer className="max-w-6xl mx-auto px-5 py-10 text-xs text-ink-mute">
          Built for the crew. Data lives in SQLite.
        </footer>
      </body>
    </html>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md hover:bg-surface-2 text-ink-dim hover:text-ink transition"
    >
      {children}
    </Link>
  );
}

function safe<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

async function safeAsync<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch {
    return undefined;
  }
}
