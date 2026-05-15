import "server-only";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import util from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import type { Player } from "./types";

const scryptAsync = util.promisify(crypto.scrypt) as (
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  keylen: number,
) => Promise<Buffer>;

const COOKIE_NAME = "forza_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function getSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const dataDir = process.env.FORZA_DATA_DIR || path.join(process.cwd(), "data");
  const file = path.join(dataDir, ".session-secret");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, crypto.randomBytes(48).toString("hex"), {
      mode: 0o600,
    });
  }
  return fs.readFileSync(file, "utf8").trim();
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(password, salt, 64);
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function signSession(playerId: number): string {
  const secret = getSecret();
  const sig = crypto
    .createHmac("sha256", secret)
    .update(String(playerId))
    .digest("hex");
  return `${playerId}.${sig}`;
}

function verifySession(token: string): number | null {
  const [idStr, sig] = token.split(".");
  if (!idStr || !sig) return null;
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(idStr)
    .digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const id = Number(idStr);
  return Number.isFinite(id) ? id : null;
}

export async function setSessionCookie(playerId: number) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, signSession(playerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<Player | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const id = verifySession(token);
  if (!id) return null;
  const player = getDb()
    .prepare("SELECT * FROM players WHERE id = ?")
    .get(id) as Player | undefined;
  return player ?? null;
}

export async function requireAuth(): Promise<Player> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function hasAnyPlayers(): boolean {
  const row = getDb().prepare("SELECT COUNT(*) as c FROM players").get() as {
    c: number;
  };
  return row.c > 0;
}
