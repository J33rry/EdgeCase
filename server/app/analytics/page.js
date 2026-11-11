import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/adminAuth";
import { getDashboard, RANGES } from "@/lib/analyticsQueries";
import { logout } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics · EdgeCase", robots: { index: false, follow: false } };

const C = {
  accent: "#ffa116",
  ok: "#2cbb5d",
  bad: "#ef4743",
  muted: "rgba(230,230,230,0.6)",
  line: "#2a2a2a",
  card: "#181818",
};
const DIFF = { Easy: "#00b8a3", Medium: "#ffc01e", Hard: "#ef4743" };
const ACTION_LABELS = {
  explain: "Explain the problem",
  example: "Walk an example",
  hint: "Hints",
  pattern: "Which pattern",
  complexity: "Target complexity",
  edges: "Edge cases",
  approach: "Check approach",
  code: "Review my code",
  chat: "Free-form chat",
};

const fmt = (v) => (v == null ? "—" : v.toLocaleString("en-US"));
const ms = (v) => (v == null ? "—" : v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`);
const pct = (v) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`);

export default async function AnalyticsPage({ searchParams }) {
  if (!(await isAdmin())) redirect("/analytics/login");

  const requested = Number((await searchParams)?.days);
  const days = RANGES.includes(requested) ? requested : 7;

  let data = null;
  let loadError = null;
  try {
    data = await getDashboard(days);
  } catch (err) {
    console.error("Analytics query failed:", err?.message);
    loadError = "Couldn't query the analytics database. Check DATABASE_URL and that migrations have run.";
  }

  return (
    <main style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 16px 80px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <h1 style={{ color: C.accent, margin: 0, fontSize: 24, marginRight: "auto" }}>EdgeCase analytics</h1>
        <nav style={{ display: "flex", gap: 4, background: C.card, borderRadius: 8, padding: 4 }}>
          {RANGES.map((d) => (
            <Link
              key={d}
              href={`/analytics?days=${d}`}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                textDecoration: "none",
                color: d === days ? "#111" : "inherit",
                background: d === days ? C.accent : "transparent",
                fontWeight: d === days ? 600 : 400,
                fontSize: 14,
              }}
            >
              {d}d
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <button style={{ background: "none", border: `1px solid ${C.line}`, color: "inherit", borderRadius: 8, padding: "7px 12px", cursor: "pointer" }}>
            Sign out
          </button>
        </form>
      </header>

      {loadError && <Notice tone="bad">{loadError}</Notice>}
      {!loadError && !data && (
        <Notice>
          No database configured. Set <code>DATABASE_URL</code> to your Neon connection string and run{" "}
          <code>npm run db:migrate -w server</code>.
        </Notice>
      )}
      {data && data.kpis.total === 0 && <Notice>No tutor requests in the last {days} days yet.</Notice>}
      {data && data.kpis.total > 0 && <Dashboard data={data} days={days} />}
    </main>
  );
}

function Dashboard({ data, days }) {
  const { kpis } = data;
  return (
    <>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        <Stat label="Requests" value={fmt(kpis.total)} />
        <Stat label="Unique installs" value={fmt(kpis.installs)} />
        <Stat label="Success rate" value={pct(kpis.successRate)} sub={`${fmt(kpis.errors)} provider/stream errors`} />
        <Stat label="Rate limited" value={fmt(kpis.rateLimited)} />
        <Stat label="First token p50 / p95" value={`${ms(kpis.ttftP50)} / ${ms(kpis.ttftP95)}`} />
        <Stat label="Full reply p50 / p95" value={`${ms(kpis.durP50)} / ${ms(kpis.durP95)}`} sub={kpis.avgChars ? `~${fmt(Math.round(kpis.avgChars))} chars per reply` : undefined} />
      </section>

      <Card title={`Requests per day (last ${days} days, UTC)`}>
        <DailyChart series={data.series} />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <Card title="Feature usage">
          <Bars rows={data.actions.map((a) => ({ label: ACTION_LABELS[a.action] || a.action, value: a.count, note: `${fmt(a.installs)} installs` }))} />
        </Card>
        <Card title="By difficulty">
          <Bars rows={data.difficulty.map((d) => ({ label: d.difficulty, value: d.count, color: DIFF[d.difficulty] }))} />
        </Card>
      </div>

      <Card title="Top problems">
        <Table
          head={["Problem", "Difficulty", "Requests", "Installs"]}
          rows={data.problems.map((p) => [
            <a key="p" href={`https://leetcode.com/problems/${p.slug}/`} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
              {p.id ? `${p.id}. ` : ""}
              {p.slug}
            </a>,
            <span key="d" style={{ color: DIFF[p.difficulty] || C.muted }}>{p.difficulty || "—"}</span>,
            fmt(p.count),
            fmt(p.installs),
          ])}
          empty="No problem data yet."
        />
      </Card>

      <Card title="Recent failures">
        <Table
          head={["When (UTC)", "Status", "HTTP", "Action", "Problem", "Duration"]}
          rows={data.failures.map((f) => [
            f.at,
            <span key="s" style={{ color: f.status === "rate_limited" || f.status === "aborted" ? C.accent : C.bad }}>{f.status}</span>,
            f.http_status,
            f.action,
            f.problem_slug || "—",
            ms(f.duration_ms),
          ])}
          empty="No failures in this range."
        />
      </Card>
    </>
  );
}

function Notice({ children, tone }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${tone === "bad" ? C.bad : C.line}`, borderRadius: 10, padding: 16, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 13, color: C.muted }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginTop: 16, minWidth: 0 }}>
      <h2 style={{ fontSize: 15, margin: "0 0 12px", fontWeight: 600 }}>{title}</h2>
      {children}
    </section>
  );
}

function DailyChart({ series }) {
  const W = 1000;
  const H = 220;
  const pad = { top: 10, bottom: 24, left: 36 };
  const max = Math.max(1, ...series.map((d) => d.ok + d.failed));
  const slot = (W - pad.left) / series.length;
  const bw = Math.max(2, slot * 0.7);
  const y = (v) => pad.top + (H - pad.top - pad.bottom) * (1 - v / max);
  const labelEvery = Math.ceil(series.length / 10);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Requests per day">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad.left} x2={W} y1={y(max * f)} y2={y(max * f)} stroke={C.line} />
            <text x={pad.left - 6} y={y(max * f) + 4} textAnchor="end" fontSize="11" fill={C.muted}>
              {Math.round(max * f)}
            </text>
          </g>
        ))}
        {series.map((d, i) => {
          const x = pad.left + i * slot + (slot - bw) / 2;
          return (
            <g key={d.day}>
              <title>{`${d.day}: ${d.ok} ok, ${d.failed} failed`}</title>
              <rect x={x} y={y(d.ok)} width={bw} height={y(0) - y(d.ok)} fill={C.ok} rx="2" />
              <rect x={x} y={y(d.ok + d.failed)} width={bw} height={y(0) - y(d.failed)} fill={C.bad} rx="2" />
              {i % labelEvery === 0 && (
                <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="11" fill={C.muted}>
                  {d.day.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.muted, marginTop: 8 }}>
        <span><span style={{ color: C.ok }}>■</span> ok</span>
        <span><span style={{ color: C.bad }}>■</span> failed / limited</span>
      </div>
    </>
  );
}

function Bars({ rows }) {
  if (!rows.length) return <p style={{ color: C.muted, margin: 0 }}>No data yet.</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r) => (
        <div key={r.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span>{r.label}</span>
            <span style={{ color: C.muted }}>
              {fmt(r.value)}
              {r.note ? ` · ${r.note}` : ""}
            </span>
          </div>
          <div style={{ background: "#222", borderRadius: 4, height: 8 }}>
            <div style={{ width: `${(r.value / max) * 100}%`, background: r.color || C.accent, height: 8, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Table({ head, rows, empty }) {
  if (!rows.length) return <p style={{ color: C.muted, margin: 0 }}>{empty}</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} style={{ textAlign: "left", fontWeight: 500, color: C.muted, padding: "6px 8px", borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={{ padding: "6px 8px", borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
