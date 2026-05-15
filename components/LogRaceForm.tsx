"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { logRaceAction } from "@/lib/actions";
import { RacePicker } from "@/components/RacePicker";
import type { Player, TeamWithPlayers } from "@/lib/types";

type Season = { id: number; name: string; status: string };
type ScanResultDriver = {
  gamertag: string;
  position: number;
  dnf: boolean;
  car: string | null;
  best_lap: string | null;
  total_time: string | null;
  penalties: number;
  playerId: number | null;
  playerName: string | null;
};
type ScanResult = {
  track: string | null;
  laps: number | null;
  weather: string | null;
  track_temp: string | null;
  results: ScanResultDriver[];
};

export function LogRaceForm({
  seasons,
  players,
  teams,
  activeSeasonId,
  today,
}: {
  seasons: Season[];
  players: Player[];
  teams: TeamWithPlayers[];
  activeSeasonId: number | null;
  today: string;
}) {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedTrack, setScannedTrack] = useState<string | null>(null);
  const [initialGrid, setInitialGrid] = useState<(number | null)[] | undefined>(undefined);
  const [initialDnf, setInitialDnf] = useState<number[] | undefined>(undefined);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [perDriver, setPerDriver] = useState<
    Record<number, { car: string | null; best_lap: string | null; total_time: string | null; penalties: number | null }>
  >({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const trackRef = useRef<HTMLInputElement>(null);
  const lapsRef = useRef<HTMLInputElement>(null);
  const weatherRef = useRef<HTMLInputElement>(null);
  const trackTempRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  async function handleScan(file: File) {
    setScanning(true);
    setScanError(null);
    setUnmatched([]);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/scan-race", { method: "POST", body: form });
      const data: ScanResult & { error?: string } = await res.json();

      if (!res.ok || data.error) {
        setScanError(data.error ?? "Scan failed");
        return;
      }

      // Race-level fields
      if (data.track && trackRef.current) {
        trackRef.current.value = data.track;
        setScannedTrack(data.track);
      }
      if (data.laps && lapsRef.current) lapsRef.current.value = String(data.laps);
      if (data.weather && weatherRef.current) weatherRef.current.value = data.weather;
      if (data.track_temp && trackTempRef.current)
        trackTempRef.current.value = data.track_temp;

      // Build grid from positions
      const sorted = [...data.results].sort((a, b) => a.position - b.position);
      const grid: (number | null)[] = [null, null, null, null];
      const dnfIds: number[] = [];
      const missed: string[] = [];
      const driverData: typeof perDriver = {};

      for (const r of sorted) {
        if (r.playerId == null) {
          missed.push(r.gamertag);
          continue;
        }
        const idx = r.position - 1;
        if (idx >= 0 && idx < 4) grid[idx] = r.playerId;
        if (r.dnf) dnfIds.push(r.playerId);
        driverData[r.playerId] = {
          car: r.car,
          best_lap: r.best_lap,
          total_time: r.total_time,
          penalties: r.penalties ?? 0,
        };
      }

      setInitialGrid(grid);
      setInitialDnf(dnfIds);
      setPerDriver(driverData);
      if (missed.length > 0) setUnmatched(missed);
    } catch (e) {
      setScanError(String(e));
    } finally {
      setScanning(false);
    }
  }

  function onScanFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleScan(file);
  }

  function onScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) setPreviewUrl(URL.createObjectURL(file));
    else setPreviewUrl(null);
  }

  const hasScannedData = Object.keys(perDriver).length > 0;

  return (
    <form action={logRaceAction} className="space-y-8">
      {/* Scan banner */}
      <section className="bg-surface rounded-2xl border border-accent/30 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="font-bold mb-0.5">Scan standings screenshot</div>
            <div className="text-sm text-ink-mute">
              Take a pic of the post-race screen in Forza — we&apos;ll fill in positions, cars, lap times and conditions.
            </div>
          </div>
          <button
            type="button"
            onClick={() => scanInputRef.current?.click()}
            disabled={scanning}
            className="shrink-0 inline-flex items-center gap-2 bg-accent hover:brightness-110 disabled:opacity-50 px-5 py-2.5 rounded-full font-semibold text-white text-sm transition"
          >
            {scanning ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                Scanning…
              </>
            ) : (
              "📷 Scan screenshot"
            )}
          </button>
          <input
            ref={scanInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onScanFileChange}
          />
        </div>

        {scannedTrack && (
          <div className="mt-3 text-sm text-good">
            ✓ Detected: <strong>{scannedTrack}</strong> — review below and adjust if needed.
          </div>
        )}
        {scanError && <div className="mt-3 text-sm text-bad">⚠ {scanError}</div>}
        {unmatched.length > 0 && (
          <div className="mt-3 text-sm text-accent-2">
            ⚠ Could not match: {unmatched.join(", ")} — assign manually below.{" "}
            <span className="text-ink-mute">(Add gamertags in Setup to fix.)</span>
          </div>
        )}
      </section>

      {/* Race details */}
      <section className="bg-surface rounded-2xl border border-line/60 p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Season">
            <select
              name="season_id"
              required
              defaultValue={activeSeasonId ?? seasons[0].id}
              className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.status === "active" ? " · active" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              name="race_date"
              defaultValue={today}
              className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5"
            />
          </Field>
          <Field label="Track">
            <input
              ref={trackRef}
              name="track"
              placeholder="Maple Valley Long"
              required
              className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5 outline-none focus:border-accent"
            />
          </Field>
          <Field label="Mode (optional)">
            <input
              name="mode"
              placeholder="Circuit / Sprint / Drift"
              className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5"
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <Field label="Laps">
            <input
              ref={lapsRef}
              name="laps"
              type="number"
              min="1"
              placeholder="—"
              className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5"
            />
          </Field>
          <Field label="Weather">
            <input
              ref={weatherRef}
              name="weather"
              placeholder="Sunny"
              className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5"
            />
          </Field>
          <Field label="Track temp">
            <input
              ref={trackTempRef}
              name="track_temp"
              placeholder="64°F"
              className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5"
            />
          </Field>
        </div>
      </section>

      {/* Finishing order */}
      <section className="bg-surface rounded-2xl border border-line/60 p-6">
        <h2 className="font-bold tracking-wide text-sm text-ink-dim uppercase mb-4">
          Finishing order
        </h2>
        <RacePicker
          key={JSON.stringify(initialGrid)}
          players={players}
          teams={teams}
          initialGrid={initialGrid}
          initialDnf={initialDnf}
        />
      </section>

      {/* Scanned per-driver details */}
      {hasScannedData && (
        <section className="bg-surface rounded-2xl border border-line/60 p-6">
          <h2 className="font-bold tracking-wide text-sm text-ink-dim uppercase mb-4">
            Scanned details
          </h2>
          <div className="space-y-2">
            {players
              .filter((p) => perDriver[p.id])
              .map((p) => {
                const d = perDriver[p.id]!;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 flex-wrap text-sm bg-surface-2 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <span
                        className="w-2 h-6 rounded-sm"
                        style={{ background: p.color }}
                      />
                      <span className="font-bold">{p.name}</span>
                    </div>
                    {d.car && (
                      <Chip label="Car" value={d.car} />
                    )}
                    {d.best_lap && (
                      <Chip label="Best lap" value={d.best_lap} />
                    )}
                    {d.total_time && (
                      <Chip label="Race time" value={d.total_time} />
                    )}
                    {d.penalties != null && d.penalties > 0 && (
                      <Chip label="Penalties" value={String(d.penalties)} />
                    )}
                  </div>
                );
              })}
          </div>
          <div className="text-xs text-ink-mute mt-3">
            These details save with the race. Re-scan or edit manually if anything looks off.
          </div>
        </section>
      )}

      {/* Hidden inputs for per-driver scanned data */}
      {players.map((p) => {
        const d = perDriver[p.id];
        return (
          <span key={`hidden-${p.id}`} style={{ display: "none" }}>
            <input type="hidden" name={`car_${p.id}`} value={d?.car ?? ""} />
            <input type="hidden" name={`best_lap_${p.id}`} value={d?.best_lap ?? ""} />
            <input type="hidden" name={`total_time_${p.id}`} value={d?.total_time ?? ""} />
            <input
              type="hidden"
              name={`penalties_${p.id}`}
              value={d?.penalties != null ? String(d.penalties) : ""}
            />
          </span>
        );
      })}

      {/* Screenshot + notes */}
      <section className="bg-surface rounded-2xl border border-line/60 p-6 space-y-4">
        <Field label="Screenshot (optional)">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Race screenshot preview"
              className="mb-3 rounded-xl max-h-48 object-contain border border-line/60"
            />
          )}
          <input
            type="file"
            name="screenshot"
            accept="image/*"
            onChange={onScreenshotChange}
            className="block text-sm text-ink-dim file:mr-3 file:rounded-full file:border-0 file:bg-accent file:text-white file:px-4 file:py-2 file:font-semibold hover:file:brightness-110"
          />
          <div className="text-xs text-ink-mute mt-1">PNG/JPG/WEBP/GIF, up to 10MB.</div>
        </Field>
        <Field label="Notes (optional)">
          <textarea
            name="notes"
            rows={3}
            placeholder="Anything memorable? Drama, photo finish…"
            className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2.5 outline-none focus:border-accent"
          />
        </Field>
      </section>

      <div className="flex justify-end gap-2">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full text-ink-dim hover:text-ink"
        >
          Cancel
        </Link>
        <button className="bg-accent hover:brightness-110 px-6 py-2.5 rounded-full font-semibold text-white">
          Save race
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-ink-dim font-bold mb-1.5">
        {label}
      </div>
      {children}
    </label>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-black/30 rounded-full px-2.5 py-1 text-xs">
      <span className="text-ink-mute uppercase tracking-wider text-[10px]">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
