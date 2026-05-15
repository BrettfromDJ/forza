import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = process.env.FORZA_DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "forza.db");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

declare global {
  // eslint-disable-next-line no-var
  var __forzaDb: Database.Database | undefined;
}

function createDb() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#e10600',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#e10600',
      player1_id INTEGER NOT NULL REFERENCES players(id),
      player2_id INTEGER NOT NULL REFERENCES players(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      points_config TEXT NOT NULL DEFAULT '[4,3,2,1]',
      start_date TEXT,
      end_date TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS races (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
      track TEXT NOT NULL,
      mode TEXT,
      race_date TEXT NOT NULL,
      notes TEXT,
      screenshot TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS race_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
      player_id INTEGER NOT NULL REFERENCES players(id),
      position INTEGER NOT NULL,
      dnf INTEGER NOT NULL DEFAULT 0,
      UNIQUE(race_id, player_id)
    );

    CREATE INDEX IF NOT EXISTS idx_races_season ON races(season_id);
    CREATE INDEX IF NOT EXISTS idx_results_race ON race_results(race_id);
    CREATE INDEX IF NOT EXISTS idx_results_player ON race_results(player_id);
  `);

  const cols = db
    .prepare("PRAGMA table_info(seasons)")
    .all() as { name: string }[];
  if (!cols.some((c) => c.name === "regular_season_races")) {
    db.exec(
      "ALTER TABLE seasons ADD COLUMN regular_season_races INTEGER NOT NULL DEFAULT 10",
    );
  }

  const playerCols = db
    .prepare("PRAGMA table_info(players)")
    .all() as { name: string }[];
  if (!playerCols.some((c) => c.name === "password_hash")) {
    db.exec("ALTER TABLE players ADD COLUMN password_hash TEXT");
  }
}

export function getDb(): Database.Database {
  if (!globalThis.__forzaDb) globalThis.__forzaDb = createDb();
  return globalThis.__forzaDb;
}
