import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getActiveSeason, isSetupComplete, listSeasons } from "@/lib/queries";

export default async function HomePage() {
  if (!isSetupComplete()) redirect("/setup");
  await requireAuth();

  const season = getActiveSeason();
  if (season) redirect(`/seasons/${season.id}`);

  const seasons = listSeasons();
  if (seasons.length > 0) redirect(`/seasons/${seasons[0].id}`);

  redirect("/seasons");
}
