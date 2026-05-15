"use client";

import { useMemo, useState } from "react";
import type { Player, TeamWithPlayers } from "@/lib/types";

type Slot = number | null;

export function RacePicker({
  players,
  teams,
  initialGrid,
  initialDnf,
}: {
  players: Player[];
  teams: TeamWithPlayers[];
  initialGrid?: Slot[];
  initialDnf?: number[];
}) {
  const [grid, setGrid] = useState<Slot[]>(initialGrid ?? [null, null, null, null]);
  const [dnf, setDnf] = useState<Set<number>>(new Set(initialDnf ?? []));

  const placed = useMemo(() => new Set(grid.filter((g): g is number => !!g)), [grid]);
  const unplaced = players.filter(
    (p) => !placed.has(p.id) && !dnf.has(p.id),
  );

  function place(playerId: number, position: number) {
    setGrid((prev) => {
      const next = prev.slice();
      // remove playerId anywhere
      for (let i = 0; i < next.length; i++)
        if (next[i] === playerId) next[i] = null;
      next[position - 1] = playerId;
      return next;
    });
    setDnf((prev) => {
      const n = new Set(prev);
      n.delete(playerId);
      return n;
    });
  }

  function clearSlot(position: number) {
    setGrid((prev) => {
      const next = prev.slice();
      next[position - 1] = null;
      return next;
    });
  }

  function toggleDnf(playerId: number) {
    setDnf((prev) => {
      const n = new Set(prev);
      if (n.has(playerId)) n.delete(playerId);
      else {
        n.add(playerId);
        setGrid((g) => g.map((x) => (x === playerId ? null : x)));
      }
      return n;
    });
  }

  const teamColor = (playerId: number) =>
    teams.find(
      (t) => t.player1_id === playerId || t.player2_id === playerId,
    )?.color || "#666";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[1, 2, 3, 4].map((pos) => {
          const playerId = grid[pos - 1];
          const player = playerId ? players.find((p) => p.id === playerId) : null;
          const heights = ["h-40 sm:h-48", "h-32 sm:h-40", "h-24 sm:h-32", "h-20 sm:h-24"];
          const medal = ["bg-accent-2 text-black", "bg-ink-dim text-black", "bg-amber-700 text-white", "bg-line text-ink-dim"][pos - 1];
          return (
            <div key={pos} className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => playerId && clearSlot(pos)}
                className={`relative ${heights[pos - 1]} rounded-xl border-2 border-dashed transition flex items-center justify-center text-center px-2 ${
                  player
                    ? "border-transparent text-white"
                    : "border-line/60 text-ink-mute hover:border-ink-mute"
                }`}
                style={
                  player
                    ? {
                        background: teamColor(player.id),
                      }
                    : {}
                }
              >
                <div className="absolute top-2 left-2">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${medal}`}
                  >
                    P{pos}
                  </span>
                </div>
                {player ? (
                  <div>
                    <div className="font-black text-lg leading-tight">
                      {player.name}
                    </div>
                    <div className="text-xs opacity-80 mt-1">tap to clear</div>
                  </div>
                ) : (
                  <span className="text-xs">Empty</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-ink-mute font-bold mb-2">
          Place a driver
        </div>
        <div className="flex flex-wrap gap-2">
          {unplaced.length === 0 && (
            <div className="text-sm text-ink-mute">
              All drivers placed. Adjust by tapping a podium slot.
            </div>
          )}
          {unplaced.map((p) => (
            <DriverChip
              key={p.id}
              player={p}
              color={teamColor(p.id)}
              grid={grid}
              onPlace={(pos) => place(p.id, pos)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-ink-mute font-bold mb-2">
          DNF
        </div>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <label
              key={p.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer text-sm transition ${
                dnf.has(p.id)
                  ? "border-bad bg-bad/10 text-bad"
                  : "border-line text-ink-dim hover:border-ink-mute"
              }`}
            >
              <input
                type="checkbox"
                name={`dnf_${p.id}`}
                checked={dnf.has(p.id)}
                onChange={() => toggleDnf(p.id)}
                className="hidden"
              />
              {p.name}
            </label>
          ))}
        </div>
        <div className="text-xs text-ink-mute mt-1">
          DNF drivers still need a position recorded — pick where they were when they dropped.
        </div>
      </div>

      {/* Hidden inputs for form submission */}
      {players.map((p) => {
        const idx = grid.findIndex((g) => g === p.id);
        const position = idx >= 0 ? idx + 1 : 0;
        return (
          <input
            key={p.id}
            type="hidden"
            name={`position_${p.id}`}
            value={position || ""}
          />
        );
      })}
    </div>
  );
}

function DriverChip({
  player,
  color,
  grid,
  onPlace,
}: {
  player: Player;
  color: string;
  grid: Slot[];
  onPlace: (pos: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border-2 hover:scale-[1.02] transition text-sm font-bold"
        style={{ borderColor: color, color }}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        {player.name}
        <span className="text-ink-mute font-normal">→ pick</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 left-0 bg-surface-2 border border-line rounded-lg shadow-xl p-1 flex gap-1">
          {[1, 2, 3, 4].map((pos) => {
            const taken = grid[pos - 1] != null;
            return (
              <button
                key={pos}
                type="button"
                onClick={() => {
                  onPlace(pos);
                  setOpen(false);
                }}
                className={`px-3 py-2 rounded text-sm font-bold ${
                  taken
                    ? "text-ink-mute hover:bg-line"
                    : "hover:bg-accent hover:text-white"
                }`}
              >
                P{pos}
                {taken && <span className="text-[10px] block">replace</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
