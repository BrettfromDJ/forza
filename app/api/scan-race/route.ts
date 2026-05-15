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

  const prompt = `This is a screenshot from Forza Motorsport or Forza Horizon showing post-race results.

Return ONLY valid JSON — no explanation, no markdown.

Known gamertags: ${gamertagHints || "none set yet"}

Return this exact shape:
{
  "track": "track name (e.g. 'Suzuka Circuit Full Circuit') or null",
  "laps": number or null,
  "weather": "short description like 'Sunny', 'Partly Cloudy', 'Rain' or null",
  "track_temp": "temperature with unit like '64°F' or null",
  "results": [
    {
      "gamertag": "exact gamertag from screen",
      "position": 1,
      "dnf": false,
      "car": "car name like 'McLaren #03 720S' or null",
      "best_lap": "best lap time like '1:42.103' or null (use null if shown as '---')",
      "total_time": "race time like '02:00.115' or null",
      "penalties": 0
    }
  ]
}

Rules:
- positions are 1-based finishing order
- set dnf: true if the driver did not finish / TOTAL column shows DNF
- include ALL visible drivers
- gamertag must be exactly as shown on screen
- if best lap is "---" or blank, use null
- penalties is the count of penalty incidents (0 if none)`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
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

  type ScanResult = {
    track: string | null;
    laps: number | null;
    weather: string | null;
    track_temp: string | null;
    results: {
      gamertag: string;
      position: number;
      dnf: boolean;
      car: string | null;
      best_lap: string | null;
      total_time: string | null;
      penalties: number;
    }[];
  };

  let parsed: ScanResult;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? text);
  } catch {
    return NextResponse.json(
      { error: "Could not parse AI response", raw: text },
      { status: 422 },
    );
  }

  const matched = parsed.results.map((r) => {
    const lower = r.gamertag.toLowerCase();
    const player = players.find(
      (p) =>
        p.gamertag &&
        (p.gamertag.toLowerCase() === lower ||
          lower.includes(p.gamertag.toLowerCase()) ||
          p.gamertag.toLowerCase().includes(lower)),
    );
    return {
      ...r,
      playerId: player?.id ?? null,
      playerName: player?.name ?? null,
    };
  });

  return NextResponse.json({
    track: parsed.track,
    laps: parsed.laps,
    weather: parsed.weather,
    track_temp: parsed.track_temp,
    results: matched,
  });
}
