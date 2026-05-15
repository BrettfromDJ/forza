import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { isSetupComplete, getActiveSeason } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { HeaderNav } from "@/components/HeaderNav";
import { LogRaceFab } from "@/components/LogRaceFab";

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
              <HeaderNav me={me} activeSeasonId={active?.id ?? null} />
            ) : null}
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-5 py-8">{children}</main>
        {setup && me && active ? <LogRaceFab /> : null}
        <footer className="max-w-6xl mx-auto px-5 py-10 text-xs text-ink-mute">
          Built for the crew. Data lives in SQLite.
        </footer>
      </body>
    </html>
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
