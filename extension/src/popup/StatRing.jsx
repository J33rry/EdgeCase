export default function StatRing({ solved, total, size = 96 }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? Math.min(1, solved / total) : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--track)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--accent)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="46%" textAnchor="middle" className="ring-num">
        {solved}
      </text>
      <text x="50%" y="64%" textAnchor="middle" className="ring-sub">
        / {total}
      </text>
    </svg>
  );
}

export function DifficultyBar({ label, solved, total, color }) {
  const pct = total ? (solved / total) * 100 : 0;
  return (
    <div className="dbar">
      <div className="dbar-head">
        <span style={{ color }}>{label}</span>
        <span>
          <b>{solved}</b>
          <span className="muted"> / {total}</span>
        </span>
      </div>
      <div className="dbar-track">
        <div className="dbar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
