import type { TeamSeasonStats } from "@/lib/scoring";

const W = 560;
const H = 170;
const PAD = { l: 36, r: 16, t: 14, b: 22 };
const CW = W - PAD.l - PAD.r;
const CH = H - PAD.t - PAD.b;

function toPoints(history: { cumulative: number }[]): number[] {
  return [0, ...history.map((h) => h.cumulative)];
}

function px(i: number, count: number) {
  return PAD.l + (count === 1 ? CW / 2 : (i / (count - 1)) * CW);
}

function py(pts: number, maxPts: number) {
  return PAD.t + CH - (maxPts === 0 ? 0 : (pts / maxPts) * CH);
}

function makePath(pts: number[], maxPts: number) {
  return pts
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${px(i, pts.length).toFixed(1)} ${py(p, maxPts).toFixed(1)}`,
    )
    .join(" ");
}

export function PointsGapChart({ stats }: { stats: TeamSeasonStats[] }) {
  if (stats.length < 2) return null;
  const [t1, t2] = stats;
  const p1 = toPoints(t1.pointsHistory);
  const p2 = toPoints(t2.pointsHistory);
  const raceCount = Math.max(p1.length, p2.length);
  if (raceCount <= 1) return null; // need at least one race

  const maxPts = Math.max(...p1, ...p2, 1);
  const gridLines = 4;

  return (
    <div>
      <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-ink-mute font-bold mb-2 text-center">
        Points race
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full block"
        aria-hidden
      >
        {/* Horizontal grid lines */}
        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const pts = Math.round((i / gridLines) * maxPts);
          const yPos = py(pts, maxPts);
          return (
            <g key={i}>
              <line
                x1={PAD.l}
                y1={yPos}
                x2={W - PAD.r}
                y2={yPos}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeWidth={1}
              />
              <text
                x={PAD.l - 6}
                y={yPos + 4}
                textAnchor="end"
                fontSize={10}
                fill="currentColor"
                fillOpacity={0.35}
              >
                {pts}
              </text>
            </g>
          );
        })}

        {/* X-axis race labels */}
        {p1.map((_, i) => {
          if (i === 0) return null;
          return (
            <text
              key={i}
              x={px(i, p1.length)}
              y={H - 4}
              textAnchor="middle"
              fontSize={9}
              fill="currentColor"
              fillOpacity={0.35}
            >
              R{i}
            </text>
          );
        })}

        {/* Fill area between the two lines */}
        {p1.length === p2.length && (
          <polygon
            points={[
              ...p1.map((p, i) => `${px(i, p1.length).toFixed(1)},${py(p, maxPts).toFixed(1)}`),
              ...[...p2].reverse().map((p, i) => {
                const ri = p2.length - 1 - i;
                return `${px(ri, p2.length).toFixed(1)},${py(p, maxPts).toFixed(1)}`;
              }),
            ].join(" ")}
            fill={t1.totalPoints >= t2.totalPoints ? t1.team.color : t2.team.color}
            fillOpacity={0.07}
          />
        )}

        {/* Team lines */}
        <path
          d={makePath(p2, maxPts)}
          fill="none"
          stroke={t2.team.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={makePath(p1, maxPts)}
          fill="none"
          stroke={t1.team.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End dots */}
        {[
          { pts: p1, color: t1.team.color },
          { pts: p2, color: t2.team.color },
        ].map(({ pts, color }) => {
          const last = pts.length - 1;
          return (
            <circle
              key={color}
              cx={px(last, pts.length)}
              cy={py(pts[last], maxPts)}
              r={4}
              fill={color}
            />
          );
        })}
      </svg>
    </div>
  );
}
