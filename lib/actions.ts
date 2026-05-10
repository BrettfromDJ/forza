"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { getDb, UPLOAD_DIR } from "./db";

export async function setupAction(formData: FormData) {
  const db = getDb();
  const players = [1, 2, 3, 4].map((i) => ({
    name: String(formData.get(`p${i}_name`) || "").trim(),
    color: String(formData.get(`p${i}_color`) || "#e10600"),
  }));
  const teams = [1, 2].map((i) => ({
    name: String(formData.get(`t${i}_name`) || `Team ${i}`).trim(),
    color: String(formData.get(`t${i}_color`) || "#e10600"),
    p1: Number(formData.get(`t${i}_p1`)),
    p2: Number(formData.get(`t${i}_p2`)),
  }));

  if (players.some((p) => !p.name)) throw new Error("All player names required");
  for (const t of teams) {
    if (!t.p1 || !t.p2 || t.p1 === t.p2)
      throw new Error("Each team needs two distinct players");
  }
  const allPicked = teams.flatMap((t) => [t.p1, t.p2]);
  if (new Set(allPicked).size !== 4)
    throw new Error("Each player must be on exactly one team");

  const tx = db.transaction(() => {
    const upsertPlayer = db.prepare(
      `INSERT INTO players (id, name, color) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, color = excluded.color`,
    );
    players.forEach((p, idx) => upsertPlayer.run(idx + 1, p.name, p.color));

    const existingTeams = db
      .prepare("SELECT id FROM teams ORDER BY id ASC")
      .all() as { id: number }[];
    const updateTeam = db.prepare(
      "UPDATE teams SET name = ?, color = ?, player1_id = ?, player2_id = ? WHERE id = ?",
    );
    const insertTeam = db.prepare(
      "INSERT INTO teams (name, color, player1_id, player2_id) VALUES (?, ?, ?, ?)",
    );
    teams.forEach((t, idx) => {
      const existing = existingTeams[idx];
      if (existing) updateTeam.run(t.name, t.color, t.p1, t.p2, existing.id);
      else insertTeam.run(t.name, t.color, t.p1, t.p2);
    });
  });
  tx();

  revalidatePath("/", "layout");
  redirect("/");
}

export async function createSeasonAction(formData: FormData) {
  const db = getDb();
  const name = String(formData.get("name") || "").trim();
  const start = String(formData.get("start_date") || "") || null;
  const end = String(formData.get("end_date") || "") || null;
  const points = [1, 2, 3, 4]
    .map((i) => Number(formData.get(`p${i}`)))
    .filter((n) => !Number.isNaN(n));
  if (!name) throw new Error("Season name required");
  if (points.length !== 4) throw new Error("Need 4 point values");
  const status = String(formData.get("status") || "active");

  if (status === "active") {
    db.prepare(
      "UPDATE seasons SET status = 'completed' WHERE status = 'active'",
    ).run();
  }

  const info = db
    .prepare(
      `INSERT INTO seasons (name, points_config, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(name, JSON.stringify(points), start, end, status);

  revalidatePath("/", "layout");
  redirect(`/seasons/${info.lastInsertRowid}`);
}

export async function activateSeasonAction(formData: FormData) {
  const db = getDb();
  const id = Number(formData.get("id"));
  db.prepare(
    "UPDATE seasons SET status = 'completed' WHERE status = 'active'",
  ).run();
  db.prepare("UPDATE seasons SET status = 'active' WHERE id = ?").run(id);
  revalidatePath("/", "layout");
}

export async function completeSeasonAction(formData: FormData) {
  const db = getDb();
  const id = Number(formData.get("id"));
  db.prepare("UPDATE seasons SET status = 'completed' WHERE id = ?").run(id);
  revalidatePath("/", "layout");
}

export async function deleteSeasonAction(formData: FormData) {
  const db = getDb();
  const id = Number(formData.get("id"));
  db.prepare("DELETE FROM seasons WHERE id = ?").run(id);
  revalidatePath("/", "layout");
  redirect("/seasons");
}

export async function logRaceAction(formData: FormData) {
  const db = getDb();
  const seasonId = Number(formData.get("season_id"));
  const track = String(formData.get("track") || "").trim();
  const mode = String(formData.get("mode") || "").trim() || null;
  const raceDate =
    String(formData.get("race_date") || "") || new Date().toISOString().slice(0, 10);
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!seasonId) throw new Error("Season required");
  if (!track) throw new Error("Track required");

  const players = db
    .prepare("SELECT id FROM players ORDER BY id ASC")
    .all() as { id: number }[];

  const positions = players.map((p) => ({
    player_id: p.id,
    position: Number(formData.get(`position_${p.id}`)),
    dnf: formData.get(`dnf_${p.id}`) === "on" ? 1 : 0,
  }));

  if (positions.some((p) => !p.position || p.position < 1 || p.position > 4))
    throw new Error("Each player needs a position 1-4");

  const racing = positions.filter((p) => !p.dnf);
  const seen = new Set<number>();
  for (const p of racing) {
    if (seen.has(p.position))
      throw new Error("Two finishers cannot share a position");
    seen.add(p.position);
  }

  let screenshotName: string | null = null;
  const file = formData.get("screenshot") as File | null;
  if (file && typeof file === "object" && file.size > 0) {
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    if (!["png", "jpg", "jpeg", "webp", "gif"].includes(ext))
      throw new Error("Screenshot must be png/jpg/webp/gif");
    const buf = Buffer.from(await file.arrayBuffer());
    screenshotName = `${crypto.randomUUID()}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, screenshotName), buf);
  }

  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO races (season_id, track, mode, race_date, notes, screenshot)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(seasonId, track, mode, raceDate, notes, screenshotName);
    const raceId = info.lastInsertRowid as number;
    const insertResult = db.prepare(
      `INSERT INTO race_results (race_id, player_id, position, dnf)
       VALUES (?, ?, ?, ?)`,
    );
    for (const p of positions)
      insertResult.run(raceId, p.player_id, p.position, p.dnf);
    return raceId;
  });
  const raceId = tx();

  revalidatePath("/", "layout");
  redirect(`/races/${raceId}`);
}

export async function deleteRaceAction(formData: FormData) {
  const db = getDb();
  const id = Number(formData.get("id"));
  const race = db
    .prepare("SELECT screenshot, season_id FROM races WHERE id = ?")
    .get(id) as { screenshot: string | null; season_id: number } | undefined;
  if (race?.screenshot) {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, race.screenshot));
    } catch {}
  }
  db.prepare("DELETE FROM races WHERE id = ?").run(id);
  revalidatePath("/", "layout");
  redirect(race ? `/seasons/${race.season_id}` : "/");
}
