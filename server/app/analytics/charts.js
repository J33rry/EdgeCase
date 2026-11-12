"use client";

import { useEffect, useRef, useState } from "react";
import { fmtMs, fmtN } from "./format";

/* ───────────────────────────── helpers ───────────────────────────── */

const dayLabel = (d, long) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(long ? { weekday: "short" } : {}),
    timeZone: "UTC",
  });

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** Nice y-scale: ~4 intervals of 1/2/5×10^k, integers when `integer`. */
function niceScale(rawMax, integer) {
  const raw = Math.max(rawMax, integer ? 4 : 1) / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  let step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  if (integer) step = Math.max(1, Math.round(step));
  const max = step * Math.max(1, Math.ceil(rawMax / step));
  const ticks = [];
  for (let v = 0; v <= max + step / 1000; v += step) ticks.push(v);
  return { max, ticks };
}

/** Rect with rounded top corners, square at the baseline. */
function topRounded(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, h, w / 2));
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function Tooltip({ x, width, children }) {
  // Sit beside the hovered column, flipping left near the right edge.
  const flip = x + 196 > width;
  return (
    <div className="a-tip" style={flip ? { right: width - x + 14 } : { left: x + 14 }}>
      {children}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className="a-legend">
      {items.map((s) => (
        <span key={s.label} className="a-legend-item">
          <i style={{ background: s.color, borderRadius: s.line ? 2 : 3, height: s.line ? 3 : 10 }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}

/* ───────────────────────────── time chart ───────────────────────────── */

/**
 * Daily chart. `type` "stack" draws stacked bars, "line" draws lines.
 * series: [{ key, label, color }]
 */
export function TimeChart({ data, series, type = "stack", height = 240, format = fmtN, integer = true, showTotal = true }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);

  const pad = { top: 12, right: 8, bottom: 26, left: 44 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const n = data.length;
  const slot = n ? innerW / n : 0;

  const rawMax = Math.max(
    0,
    ...data.map((d) =>
      type === "stack" ? series.reduce((s, k) => s + (d[k.key] || 0), 0) : Math.max(0, ...series.map((k) => d[k.key] ?? 0)),
    ),
  );
  const { max, ticks } = niceScale(rawMax, integer);
  const y = (v) => pad.top + innerH * (1 - v / max);
  const cx = (i) => pad.left + slot * (i + 0.5);

  const labelEvery = Math.max(1, Math.ceil(64 / Math.max(slot, 1)));
  const bw = Math.max(1.5, Math.min(22, slot * 0.56));

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.floor((e.clientX - rect.left - pad.left) / slot);
    setHover(i >= 0 && i < n ? i : null);
  }

  const linePath = (key) => {
    let d = "";
    let pen = false;
    data.forEach((row, i) => {
      const v = row[key];
      if (v == null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${cx(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  const h = hover != null ? data[hover] : null;
  const total = h ? series.reduce((s, k) => s + (h[k.key] || 0), 0) : 0;

  return (
    <div ref={ref} className="a-chart" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className={t === 0 ? "a-axis" : "a-gridline"} />
              <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="a-tick">
                {format(t)}
              </text>
            </g>
          ))}

          {hover != null && <rect x={pad.left + hover * slot} y={pad.top} width={slot} height={innerH} className="a-hoverband" />}

          {type === "stack" &&
            data.map((d, i) => {
              const x = cx(i) - bw / 2;
              let acc = 0;
              const segs = series.filter((s) => d[s.key] > 0);
              return (
                <g key={d.day} opacity={hover == null || hover === i ? 1 : 0.45}>
                  {segs.map((s, j) => {
                    const v = d[s.key];
                    const top = y(acc + v);
                    const bottom = y(acc);
                    acc += v;
                    const gap = j > 0 ? 1.5 : 0;
                    const hh = Math.max(0, bottom - top - gap);
                    if (hh <= 0) return null;
                    return j === segs.length - 1 ? (
                      <path key={s.key} d={topRounded(x, top, bw, hh, 3)} fill={s.color} />
                    ) : (
                      <rect key={s.key} x={x} y={top} width={bw} height={hh} fill={s.color} />
                    );
                  })}
                </g>
              );
            })}

          {type === "line" && (
            <>
              {hover != null && <line x1={cx(hover)} x2={cx(hover)} y1={pad.top} y2={pad.top + innerH} className="a-crosshair" />}
              {series.map((s) => (
                <path key={s.key} d={linePath(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              ))}
              {/* Lone points (neighbours null) would be invisible as a path. */}
              {series.map((s) =>
                data.map((d, i) =>
                  d[s.key] != null && data[i - 1]?.[s.key] == null && data[i + 1]?.[s.key] == null ? (
                    <circle key={`${s.key}${i}`} cx={cx(i)} cy={y(d[s.key])} r="2.5" fill={s.color} />
                  ) : null,
                ),
              )}
              {h &&
                series.map((s) =>
                  h[s.key] != null ? <circle key={s.key} cx={cx(hover)} cy={y(h[s.key])} r="4.5" fill={s.color} className="a-dot" /> : null,
                )}
            </>
          )}

          {data.map((d, i) =>
            i % labelEvery === (n - 1) % labelEvery ? (
              <text key={d.day} x={cx(i)} y={height - 8} textAnchor="middle" className="a-tick">
                {dayLabel(d.day)}
              </text>
            ) : null,
          )}
        </svg>
      )}
      {h && (
        <Tooltip x={cx(hover)} width={width}>
          <div className="a-tip-title">{dayLabel(h.day, true)}</div>
          {[...series].reverse().map((s) => (
            <div key={s.key} className="a-tip-row">
              <i style={{ background: s.color }} />
              <span>{s.label}</span>
              <b>{format(h[s.key])}</b>
            </div>
          ))}
          {type === "stack" && showTotal && (
            <div className="a-tip-row a-tip-total">
              <span>Total</span>
              <b>{format(total)}</b>
            </div>
          )}
        </Tooltip>
      )}
    </div>
  );
}

/* ───────────────────────────── latency (tabbed) ───────────────────────────── */

export function LatencyChart({ data, colors }) {
  const [metric, setMetric] = useState("ttft");
  const keys = metric === "ttft" ? ["ttftP50", "ttftP95"] : ["durP50", "durP95"];
  const series = [
    { key: keys[0], label: "p50", color: colors[0] },
    { key: keys[1], label: "p95", color: colors[1] },
  ];
  return (
    <>
      <div className="a-card-tools">
        <div className="a-seg" role="tablist">
          {[
            ["ttft", "First token"],
            ["dur", "Full reply"],
          ].map(([k, label]) => (
            <button key={k} role="tab" aria-selected={metric === k} className={metric === k ? "on" : ""} onClick={() => setMetric(k)}>
              {label}
            </button>
          ))}
        </div>
        <Legend items={series.map((s) => ({ ...s, line: true }))} />
      </div>
      <TimeChart data={data} series={series} type="line" format={fmtMs} integer={false} height={220} />
    </>
  );
}

/* ───────────────────────────── sparkline ───────────────────────────── */

export function Sparkline({ values, color = "var(--s1)" }) {
  const pts = values.map((v, i) => [i, v]).filter(([, v]) => v != null);
  if (pts.length < 2) return <div className="a-spark" />;
  const W = 100;
  const H = 28;
  const max = Math.max(...pts.map(([, v]) => v));
  const min = Math.min(...pts.map(([, v]) => v));
  const span = max - min || 1;
  const x = (i) => (i / (values.length - 1)) * W;
  const y = (v) => H - 2 - ((v - min) / span) * (H - 4);
  const line = pts.map(([i, v], j) => `${j ? "L" : "M"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join("");
  const area = `${line}L${x(pts.at(-1)[0])},${H}L${x(pts[0][0])},${H}Z`;
  const id = `sp${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg className="a-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/* ───────────────────────────── heatmap ───────────────────────────── */

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Heatmap({ grid }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...grid.flat());
  const dayTotals = grid.map((r) => r.reduce((a, b) => a + b, 0));
  const hourTotals = grid[0].map((_, h) => grid.reduce((s, r) => s + r[h], 0));
  const peakHour = hourTotals.indexOf(Math.max(...hourTotals));
  const peakDay = dayTotals.indexOf(Math.max(...dayTotals));
  const hh = (h) => `${String(h).padStart(2, "0")}:00`;

  return (
    <div className="a-heat-wrap">
      <div className="a-heat" onPointerLeave={() => setHover(null)}>
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className="a-heat-h">
            {h % 6 === 0 ? hh(h) : ""}
          </span>
        ))}
        {grid.map((row, d) => (
          <div key={d} style={{ display: "contents" }}>
            <span className="a-heat-d">{DOW[d]}</span>
            {row.map((v, h) => (
              <span
                key={h}
                className={`a-heat-cell${hover && hover[0] === d && hover[1] === h ? " on" : ""}`}
                style={{ "--a": v ? 0.14 + 0.86 * (v / max) : 0 }}
                onPointerEnter={() => setHover([d, h])}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="a-heat-foot">
        <span className="a-heat-read">
          {hover
            ? `${DOW[hover[0]]} ${hh(hover[1])}–${hh((hover[1] + 1) % 24)} UTC · ${fmtN(grid[hover[0]][hover[1]])} requests`
            : `Busiest: ${DOW[peakDay]}s, around ${hh(peakHour)} UTC`}
        </span>
        <span className="a-heat-scale">
          less
          {[0.14, 0.35, 0.57, 0.78, 1].map((a) => (
            <i key={a} style={{ "--a": a }} />
          ))}
          more
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────────── segmented bar ───────────────────────────── */

/** Part-to-whole bar. items: [{ label, value, color }] */
export function SegmentedBar({ items, format = fmtN }) {
  const [hover, setHover] = useState(null);
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!total) return <p className="a-empty">No data yet.</p>;
  const shown = items.filter((i) => i.value > 0);
  return (
    <div>
      <div className="a-segbar" onPointerLeave={() => setHover(null)}>
        {shown.map((it) => (
          <span
            key={it.label}
            style={{ flexGrow: it.value, background: it.color, opacity: hover == null || hover === it.label ? 1 : 0.35 }}
            onPointerEnter={() => setHover(it.label)}
            title={`${it.label}: ${format(it.value)} (${((it.value / total) * 100).toFixed(1)}%)`}
          />
        ))}
      </div>
      <ul className="a-seglist">
        {items.map((it) => (
          <li
            key={it.label}
            className={hover === it.label ? "on" : ""}
            onPointerEnter={() => setHover(it.label)}
            onPointerLeave={() => setHover(null)}
          >
            <i style={{ background: it.color }} />
            <span>{it.label}</span>
            <b>{format(it.value)}</b>
            <em>{((it.value / total) * 100).toFixed(1)}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
