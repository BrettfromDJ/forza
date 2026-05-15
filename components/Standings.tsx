import Link from "next/link";
import type { TeamSeasonStats } from "@/lib/scoring";

export function StandingsScoreboard({
  stats,
}: {
  stats: TeamSeasonStats[];
}) {
  if (stats.length === 0) return null;
  const sorted = [...stats].sort(
    (a, b) => b.totalPoints - a.totalPoints || b.raceWins - a.raceWins,
  );

  if (sorted.length === 1) {
    const only = sorted[0];
    return (
      <div className="rounded-3xl bg-gradient-to-br from-surface to-surface-2 border border-line/60 p-8 text-center">
        <div className="text-sm font-bold uppercase tracking-wider mb-2">
          {only.team.name}
        </div>
        <div
          className="text-7xl font-black tabular-nums"
          style={{ color: only.team.color }}
        >
          {only.totalPoints}
        </div>
        <div className="text-xs text-ink-mute mt-2 uppercase tracking-wider">
          Points
        </div>
      </div>
    );
  }

  const [t1, t2] = sorted;
  const lead = t1.totalPoints - t2.totalPoints;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-surface to-surface-2 border border-line/60 px-4 py-8 sm:p-10 relative overflow-hidden">
      {/* Subtle team color glows on each side */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 opacity-[0.07] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at left center, ${t1.team.color}, transparent 70%)`,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-y-0 right-0 w-1/2 opacity-[0.07] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at right center, ${t2.team.color}, transparent 70%)`,
        }}
        aria-hidden
      />

      <div className="relative grid grid-cols-[1fr_auto_1fr] items-stretch gap-1 sm:gap-6">
        <TeamSide stats={t1} align="right" />

        <CenterDivider lead={lead} />

        <TeamSide stats={t2} align="left" />
      </div>
    </div>
  );
}

function TeamSide({
  stats,
  align,
}: {
  stats: TeamSeasonStats;
  align: "left" | "right";
}) {
  const isLeft = align === "right"; // left column → right-aligned content
  return (
    <Link
      href={`/teams/${stats.team.id}`}
      className={`block hover:opacity-95 transition min-w-0 ${
        isLeft ? "text-right" : "text-left"
      }`}
    >
      <div
        className={`flex items-center gap-2 mb-2 sm:mb-3 ${
          isLeft ? "justify-end" : "justify-start"
        }`}
      >
        {!isLeft && (
          <span
            className="w-2.5 h-2.5 sm:w-2.5 sm:h-2.5 rounded-full shrink-0"
            style={{ background: stats.team.color }}
          />
        )}
        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider truncate">
          {stats.team.name}
        </span>
        {isLeft && (
          <span
            className="w-2.5 h-2.5 sm:w-2.5 sm:h-2.5 rounded-full shrink-0"
            style={{ background: stats.team.color }}
          />
        )}
      </div>

      <div
        className="font-black tabular-nums leading-[0.85] text-8xl sm:text-8xl md:text-[10rem]"
        style={{ color: stats.team.color }}
      >
        {stats.totalPoints}
      </div>

      <div className="text-xs sm:text-xs text-ink-mute mt-4 sm:mt-4 truncate">
        {stats.team.player1.name} & {stats.team.player2.name}
      </div>
      <div className="text-xs sm:text-xs text-ink-mute mt-0.5">
        {stats.races} race{stats.races === 1 ? "" : "s"} · {stats.raceWins}W ·{" "}
        {stats.oneTwo} 1-2
      </div>
    </Link>
  );
}

function CenterDivider({ lead }: { lead: number }) {
  return (
    <div className="flex flex-col items-center self-stretch px-2 sm:px-4">
      <div className="flex-1 w-px bg-line/50" />
      <div className="py-2 sm:py-3">
        {lead > 0 ? (
          <div className="text-center">
            <div className="text-[10px] sm:text-[10px] text-ink-mute uppercase tracking-[0.15em] font-bold">
              Lead
            </div>
            <div className="text-3xl sm:text-4xl font-black tabular-nums text-accent leading-none mt-1">
              +{lead}
            </div>
          </div>
        ) : (
          <div className="bg-ink-mute/15 text-ink-mute text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            Tied
          </div>
        )}
      </div>
      <div className="flex-1 w-px bg-line/50" />
    </div>
  );
}
