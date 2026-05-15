import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getActiveSeason,
  isSetupComplete,
  listPlayers,
  listSeasons,
  listTeams,
} from "@/lib/queries";
import { requireAuth } from "@/lib/auth";
import { LogRaceForm } from "@/components/LogRaceForm";

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
      <LogRaceForm
        seasons={seasons}
        players={players}
        teams={teams}
        activeSeasonId={active?.id ?? null}
        today={today}
      />
    </div>
  );
}
