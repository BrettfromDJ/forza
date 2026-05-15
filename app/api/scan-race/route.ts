import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { listPlayers } from "@/lib/queries";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set" },
      { status: 500 },
    );
  }

  const form = await req.formData();
  const file = form.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = (file.type || "image/jpeg") as
    | "image/jpeg"
    | "image/png"
    | "image/webp"
    | "image/gif";

  const players = listPlayers();
  const gamertagHints = players
    .filter((p) => p.gamertag)
    .map((p) => `"${p.gamertag}" = ${p.name}`)
    .join(", ");

  const prompt = `This is a screenshot from Forza Motorsport or Forza Horizon showing race results.

Extract the finishing order and return ONLY valid JSON — no explanation, no markdown, just the JSON object.

Known gamertags: ${gamertagHints || "none set yet"}

Return this exact shape:
{
  "track": "track name or null if not visible",
  "results": [
    { "gamertag": "exact gamertag from screen", "position": 1, "dnf": false },
    { "gamertag": "exact gamertag from screen", "position": 2, "dnf": false }
  ]
}

Rules:
- positions are 1-based finishing order (1st, 2nd, 3rd, 4th)
- set dnf: true if the driver did not finish / retired
- include ALL visible drivers
- gamertag should be exactly as shown on screen`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  let parsed: { track: string | null; results: { gamertag: string; position: number; dnf: boolean }[] };
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? text);
  } catch {
    return NextResponse.json({ error: "Could not parse AI response", raw: text }, { status: 422 });
  }

  // Match gamertags to player IDs
  const matched = parsed.results.map((r) => {
    const lower = r.gamertag.toLowerCase();
    const player = players.find(
      (p) =>
        p.gamertag &&
        (p.gamertag.toLowerCase() === lower ||
          lower.includes(p.gamertag.toLowerCase()) ||
          p.gamertag.toLowerCase().includes(lower)),
    );
    return { ...r, playerId: player?.id ?? null, playerName: player?.name ?? null };
  });

  return NextResponse.json({ track: parsed.track, results: matched });
}
