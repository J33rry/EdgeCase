import { Heatmap, LatencyChart, Legend, SegmentedBar, Sparkline, TimeChart } from "./charts";
import { fmtMs, fmtN } from "./format";

const DIFF = { Easy: "var(--easy)", Medium: "var(--medium)", Hard: "var(--hard)" };
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
const STATUS = {
  ok: { label: "Answered", color: "var(--good)" },
  rate_limited: { label: "Rate limited", color: "var(--warning)" },
  aborted: { label: "Aborted by user", color: "var(--serious)" },
  errors: { label: "Provider / stream error", color: "var(--critical)" },
  invalid: { label: "Invalid request", color: "#6b6a65" },
};

const pct = (v, d = 1) => (v == null ? "—" : `${(v * 100).toFixed(d)}%`);

function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ───────────────────────────── dashboard ───────────────────────────── */

export default function Dashboard({ data, days }) {
  const { kpis, prev, series } = data;

  const statusItems = (() => {
    const by = Object.fromEntries(data.statuses.map((s) => [s.status, s.count]));
    return ["ok", "rate_limited", "aborted", "errors", "invalid"]
      .map((k) => ({
        ...STATUS[k],
        value: k === "errors" ? (by.provider_error || 0) + (by.stream_error || 0) : by[k] || 0,
      }))
      .filter((s) => s.value > 0 || s.label === STATUS.ok.label);
  })();

  return (
    <>
      <section className="a-kpis">
        <Kpi
          label="Requests"
          value={fmtN(kpis.total)}
          delta={<Delta cur={kpis.total} prev={prev.total} />}
          spark={series.map((d) => d.total)}
        />
        <Kpi
          label="Active installs"
          value={fmtN(kpis.installs)}
          delta={<Delta cur={kpis.installs} prev={prev.installs} />}
          spark={series.map((d) => d.installs)}
        />
        <Kpi
          label="New installs"
          value={fmtN(kpis.newInstalls)}
          delta={<Delta cur={kpis.newInstalls} prev={prev.newInstalls} />}
          spark={series.map((d) => d.newInstalls)}
          color="var(--brand-green)"
        />
        <Kpi
          label="Success rate"
          value={pct(kpis.successRate)}
          delta={<Delta cur={kpis.successRate} prev={prev.successRate} points />}
          sub={`${fmtN(kpis.errors)} errors`}
          spark={series.map((d) => d.successRate)}
          color="var(--good)"
        />
        <Kpi
          label="First token (p50)"
          value={fmtMs(kpis.ttftP50)}
          delta={<Delta cur={kpis.ttftP50} prev={prev.ttftP50} lowerIsBetter />}
          sub={`p95 ${fmtMs(kpis.ttftP95)}`}
          spark={series.map((d) => d.ttftP50)}
          color="var(--s2)"
        />
        <Kpi
          label="Requests / install"
          value={kpis.perInstall == null ? "—" : kpis.perInstall.toFixed(1)}
          sub={kpis.avgMessages ? `~${kpis.avgMessages.toFixed(1)} msgs per conversation` : undefined}
          spark={series.map((d) => (d.installs ? d.total / d.installs : null))}
        />
      </section>

      <h3 className="a-section-title">Traffic</h3>
      <div className="a-grid">
        <Card
          className="span-12"
          title="Requests per day"
          subtitle="Every /api/tutor call, by outcome · UTC days"
          right={
            <Legend
              items={[
                { label: "Answered", color: "var(--good)" },
                { label: "Rate limited", color: "var(--warning)" },
                { label: "Failed", color: "var(--critical)" },
              ]}
            />
          }
        >
          <TimeChart
            data={series}
            series={[
              { key: "ok", label: "Answered", color: "var(--good)" },
              { key: "limited", label: "Rate limited", color: "var(--warning)" },
              { key: "failed", label: "Failed", color: "var(--critical)" },
            ]}
            height={260}
          />
        </Card>

        <Card
          className="span-6"
          title="Installs per day"
          subtitle="Distinct installs active, and installs seen for the first time"
          right={
            <Legend
              items={[
                { label: "Active", color: "var(--s1)", line: true },
                { label: "New", color: "var(--s2)", line: true },
              ]}
            />
          }
        >
          <TimeChart
            data={series}
            type="line"
            series={[
              { key: "installs", label: "Active", color: "var(--s1)" },
              { key: "newInstalls", label: "New", color: "var(--s2)" },
            ]}
            height={220}
          />
        </Card>

        <Card className="span-6" title="Latency" subtitle="Successful replies only · daily percentiles">
          <LatencyChart data={series} colors={["var(--s1)", "var(--s2)"]} />
        </Card>

        <Card className="span-8" title="When people study" subtitle="Requests by weekday and hour (UTC)">
          <Heatmap grid={data.heatmap} />
        </Card>

        <Card className="span-4" title="Outcomes" subtitle={`${fmtN(kpis.total)} requests in ${days} days`}>
          <SegmentedBar items={statusItems} />
        </Card>
      </div>

      <h3 className="a-section-title">How the tutor is used</h3>
      <div className="a-grid">
        <Card className="span-7" title="Feature usage" subtitle="Requests that reached the model, by tutor action">
          <FeatureTable actions={data.actions} />
        </Card>

        <div className="a-stack span-5">
          <Card title="Difficulty mix" subtitle="Which problems people ask about">
            <SegmentedBar
              items={data.difficulty.map((d) => ({
                label: d.difficulty,
                value: d.count,
                color: DIFF[d.difficulty] || "#6b6a65",
              }))}
            />
          </Card>
          <div className="a-grid" style={{ marginTop: 0 }}>
            <Card className="span-6" title="Hint depth" subtitle="Hint requests by level">
              <Histogram
                rows={data.hints.map((h) => ({ label: `L${h.level}`, value: h.count }))}
                empty="No hint requests yet."
              />
            </Card>
            <Card className="span-6" title="Engagement" subtitle="Installs by requests made">
              <Histogram rows={data.engagement.map((e) => ({ label: e.bucket, value: e.installs }))} empty="No installs yet." />
            </Card>
          </div>
        </div>
      </div>

      <h3 className="a-section-title">Detail</h3>
      <div className="a-grid">
        <Card className="span-12" title="Top problems" subtitle="Most-asked-about LeetCode problems">
          <ProblemsTable problems={data.problems} />
        </Card>
        <Card className="span-12" title="Recent failures" subtitle="Latest 20 requests that didn't end in an answer">
          <FailuresTable failures={data.failures} />
        </Card>
      </div>
    </>
  );
}

/* ───────────────────────────── pieces ───────────────────────────── */

function Card({ title, subtitle, right, className = "", children }) {
  return (
    <section className={`a-card ${className}`}>
      <div className="a-card-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, value, delta, sub, spark, color }) {
  return (
    <div className="a-card a-kpi">
      <div className="a-kpi-label">{label}</div>
      <div className="a-kpi-value">{value}</div>
      <div className="a-kpi-sub">
        {delta}
        {sub}
      </div>
      {spark && <Sparkline values={spark} color={color} />}
    </div>
  );
}

/** Change vs the previous period. `points` compares rates in percentage points. */
function Delta({ cur, prev, points, lowerIsBetter }) {
  if (cur == null || prev == null) return null;
  if (!points && prev === 0) return cur > 0 ? <span className="a-delta up">new</span> : null;
  const change = points ? (cur - prev) * 100 : ((cur - prev) / prev) * 100;
  const flat = Math.abs(change) < 0.5;
  const good = lowerIsBetter ? change < 0 : change > 0;
  const cls = flat ? "flat" : good ? "up" : "down";
  const arrow = flat ? "→" : change > 0 ? "↑" : "↓";
  const text = points ? `${Math.abs(change).toFixed(1)}pp` : `${Math.abs(change) >= 100 ? Math.round(Math.abs(change)) : Math.abs(change).toFixed(0)}%`;
  return (
    <span className={`a-delta ${cls}`} title="vs previous period">
      {arrow} {text}
    </span>
  );
}

function FeatureTable({ actions }) {
  if (!actions.length) return <p className="a-empty">No data yet.</p>;
  const max = Math.max(...actions.map((a) => a.count));
  const total = actions.reduce((s, a) => s + a.count, 0);
  return (
    <div className="a-ranked">
      <div className="a-ranked-head">
        <span>Action</span>
        <span>Share</span>
        <span>Requests</span>
        <span>Installs</span>
        <span>Success</span>
      </div>
      {actions.map((a) => (
        <div key={a.action} className="a-ranked-row" title={a.durP50 ? `Median full reply ${fmtMs(a.durP50)}` : undefined}>
          <span>{ACTION_LABELS[a.action] || a.action}</span>
          <div className="a-meter-track" title={pct(a.count / total)}>
            <div className="a-meter" style={{ width: `${(a.count / max) * 100}%` }} />
          </div>
          <span>{fmtN(a.count)}</span>
          <span className="muted" style={{ color: "var(--muted)" }}>
            {fmtN(a.installs)}
          </span>
          <span style={{ color: a.successRate != null && a.successRate < 0.95 ? "var(--critical-text)" : undefined }}>
            {pct(a.successRate, 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Histogram({ rows, empty }) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  if (!max) return <p className="a-empty">{empty}</p>;
  return (
    <div>
      <div className="a-hist">
        {rows.map((r) => (
          <div key={r.label} className="a-hist-col" title={`${r.label}: ${fmtN(r.value)}`}>
            <b>{fmtN(r.value)}</b>
            <div className="a-hist-bar" style={{ height: `${(r.value / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="a-hist-labels">
        {rows.map((r) => (
          <span key={r.label}>{r.label}</span>
        ))}
      </div>
    </div>
  );
}

function ProblemsTable({ problems }) {
  if (!problems.length) return <p className="a-empty">No problem data yet.</p>;
  const max = Math.max(...problems.map((p) => p.count));
  return (
    <div className="a-table-wrap">
      <table className="a-table">
        <thead>
          <tr>
            <th>Problem</th>
            <th>Difficulty</th>
            <th>Requests</th>
            <th className="num">Installs</th>
            <th className="num">Success</th>
            <th className="num">Last asked</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((p) => (
            <tr key={p.slug}>
              <td>
                <a href={`https://leetcode.com/problems/${p.slug}/`} target="_blank" rel="noreferrer">
                  {p.id && <span className="muted">{p.id}. </span>}
                  {p.slug}
                </a>
              </td>
              <td>
                {p.difficulty ? (
                  <span className="a-pill">
                    <i style={{ background: DIFF[p.difficulty] || "#6b6a65" }} />
                    {p.difficulty}
                  </span>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td>
                <span style={{ display: "inline-block", minWidth: 32 }}>{fmtN(p.count)}</span>
                <span className="a-inline-bar" style={{ width: `${Math.max(2, (p.count / max) * 120)}px` }} />
              </td>
              <td className="num">{fmtN(p.installs)}</td>
              <td className="num">{pct(p.successRate, 0)}</td>
              <td className="num muted" title={p.last_at}>
                {ago(p.last_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FailuresTable({ failures }) {
  if (!failures.length) return <p className="a-empty">No failures in this range. 🎉</p>;
  const statusColor = (s) =>
    s === "rate_limited"
      ? STATUS.rate_limited.color
      : s === "aborted"
        ? STATUS.aborted.color
        : s === "invalid"
          ? STATUS.invalid.color
          : STATUS.errors.color;
  return (
    <div className="a-table-wrap">
      <table className="a-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Status</th>
            <th className="num">HTTP</th>
            <th>Action</th>
            <th>Problem</th>
            <th className="num">Duration</th>
          </tr>
        </thead>
        <tbody>
          {failures.map((f, i) => (
            <tr key={i}>
              <td title={f.at}>
                {ago(f.at)} <span className="muted a-mono">{f.at.slice(5, 16).replace("T", " ")}</span>
              </td>
              <td>
                <span className="a-pill">
                  <i style={{ background: statusColor(f.status) }} />
                  {f.status.replace("_", " ")}
                </span>
              </td>
              <td className="num a-mono">{f.http_status ?? "—"}</td>
              <td>{ACTION_LABELS[f.action] || f.action}</td>
              <td className="muted">{f.problem_slug || "—"}</td>
              <td className="num">{fmtMs(f.duration_ms)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
