import type { Player, RaceWithResults } from "./types";

export function weatherEmoji(weather: string | null): string {
  if (!weather) return "";
  const w = weather.toLowerCase();
  if (w.includes("rain") || w.includes("wet") || w.includes("storm")) return "🌧️";
  if (w.includes("snow")) return "❄️";
  if (w.includes("fog") || w.includes("mist")) return "🌫️";
  if (w.includes("partly") || w.includes("cloud")) return "⛅";
  if (w.includes("overcast")) return "☁️";
  if (w.includes("sun") || w.includes("clear")) return "☀️";
  return "🌤️";
}

// Parse a lap time string like "1:42.103" or "0:58.421" into total milliseconds.
// Returns null if not parseable.
export function parseLapTime(time: string | null): number | null {
  if (!time) return null;
  const m = time.match(/^(?:(\d+):)?(\d+)\.(\d+)$/);
  if (!m) return null;
  const minutes = m[1] ? Number(m[1]) : 0;
  const seconds = Number(m[2]);
  const ms = Number(m[3].padEnd(3, "0").slice(0, 3));
  if (Number.isNaN(minutes + seconds + ms)) return null;
  return minutes * 60_000 + seconds * 1000 + ms;
}

export type FastestLap = {
  player: Player;
  time: string;
};

export function fastestLap(race: RaceWithResults): FastestLap | null {
  let best: { result: typeof race.results[number]; ms: number } | null = null;
  for (const r of race.results) {
    const ms = parseLapTime(r.best_lap);
    if (ms == null) continue;
    if (!best || ms < best.ms) best = { result: r, ms };
  }
  if (!best) return null;
  return { player: best.result.player, time: best.result.best_lap! };
}
