import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { isSetupComplete, getActiveSeason } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Forza League",
  description: "Track your Forza races, seasons, and team standings.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setup = safe(() => isSetupComplete());
  const active = safe(() => getActiveSeason());

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
            {setup ? (
              <nav className="flex items-center gap-1 text-sm">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/seasons">Seasons</NavLink>
                <NavLink href="/teams">Teams</NavLink>
                {active && (
                  <Link
                    href="/races/new"
                    className="ml-3 inline-flex items-center gap-2 bg-accent hover:brightness-110 transition px-4 py-2 rounded-full font-semibold text-sm text-white"
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
