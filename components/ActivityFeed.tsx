import Link from "next/link";
import { formatRelativeDate, type FeedItem } from "@/lib/feed";

export function ActivityFeed({
  items,
  limit = 8,
}: {
  items: FeedItem[];
  limit?: number;
}) {
  const visible = items.slice(0, limit);

  if (visible.length === 0) {
    return (
      <div className="bg-surface border border-line/60 border-dashed rounded-2xl p-6 text-center text-sm text-ink-mute">
        Activity will land here as soon as a race gets logged.
      </div>
    );
  }

  return (
    <ol className="bg-surface rounded-2xl border border-line/60 divide-y divide-line/40 overflow-hidden">
      {visible.map((item) => (
        <li key={item.id}>
          <FeedRow item={item} />
        </li>
      ))}
    </ol>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  if (item.kind === "race") {
    return (
      <Link
        href={`/races/${item.raceId}`}
        className="flex items-start gap-3 p-4 hover:bg-surface-2 transition"
      >
        <Avatar emoji={item.isTie ? "🤝" : "🏁"} />
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            {item.isTie ? (
              <span>
                <strong>Tie</strong> at{" "}
                <span className="text-ink">{item.track}</span>
              </span>
            ) : item.winningTeam ? (
              <span>
                <strong style={{ color: item.winningTeam.color }}>
                  {item.winningTeam.name}
                </strong>{" "}
                won at <span className="text-ink">{item.track}</span>
              </span>
            ) : (
              <span>
                Race logged at{" "}
                <span className="text-ink">{item.track}</span>
              </span>
            )}
          </div>
          {item.p1Player && (
            <div className="text-xs text-ink-mute mt-0.5">
              P1 ·{" "}
              <span style={{ color: item.p1Player.color }}>
                {item.p1Player.name}
              </span>
            </div>
          )}
        </div>
        <DateChip date={item.date} />
      </Link>
    );
  }

  return (
    <Link
      href={`/players/${item.player.id}`}
      className="flex items-start gap-3 p-4 hover:bg-surface-2 transition"
    >
      <Avatar emoji={item.achievement.icon} highlight />
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <strong style={{ color: item.player.color }}>
            {item.player.name}
          </strong>{" "}
          earned <strong>{item.achievement.name}</strong>
        </div>
        <div className="text-xs text-ink-mute mt-0.5">
          {item.achievement.description}
        </div>
      </div>
      <DateChip date={item.date} />
    </Link>
  );
}

function Avatar({
  emoji,
  highlight,
}: {
  emoji: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${
        highlight
          ? "bg-accent/20 ring-1 ring-accent/40"
          : "bg-black/30"
      }`}
    >
      {emoji}
    </div>
  );
}

function DateChip({ date }: { date: string }) {
  return (
    <span className="shrink-0 text-[10px] uppercase tracking-wider text-ink-mute mt-1 tabular-nums">
      {formatRelativeDate(date)}
    </span>
  );
}
