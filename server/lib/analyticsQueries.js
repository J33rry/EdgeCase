import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export const RANGES = [7, 30, 90];

const n = (v) => (v == null ? null : Number(v));
const DAY_MS = 86400000;

// Statuses that never reached the model; excluded from feature/content breakdowns.
const NOT_SERVED = sql`status not in ('invalid', 'rate_limited')`;

export const ENGAGEMENT_BUCKETS = ["1", "2–5", "6–20", "21+"];

/**
 * Everything the /analytics page shows for the last `days` days, plus the
 * previous `days` days for comparison. Returns null when DATABASE_URL isn't set.
 */
export async function getDashboard(days) {
  const db = getDb();
  if (!db) return null;

  const since = sql`created_at >= now() - make_interval(days => ${days})`;
  const prevWindow = sql`created_at >= now() - make_interval(days => ${days * 2}) and created_at < now() - make_interval(days => ${days})`;
  const rows = async (query) => (await db.execute(query)).rows;

  const firsts = sql`firsts as (
    select install_hash, min(created_at) as first_at
    from tutor_events where install_hash is not null group by 1
  )`;

  const [kpiRows, prevRows, newRows, daily, dailyNew, actions, problems, difficulty, statuses, heat, hints, engagement, failures] =
    await Promise.all([
      rows(sql`
        select
          count(*) as total,
          count(distinct install_hash) as installs,
          count(*) filter (where status = 'ok') as ok,
          count(*) filter (where status = 'rate_limited') as rate_limited,
          count(*) filter (where status in ('provider_error', 'stream_error')) as errors,
          percentile_cont(0.5) within group (order by ttft_ms) filter (where status = 'ok') as ttft_p50,
          percentile_cont(0.95) within group (order by ttft_ms) filter (where status = 'ok') as ttft_p95,
          percentile_cont(0.5) within group (order by duration_ms) filter (where status = 'ok') as dur_p50,
          percentile_cont(0.95) within group (order by duration_ms) filter (where status = 'ok') as dur_p95,
          avg(output_chars) filter (where status = 'ok') as avg_chars,
          avg(message_count) filter (where status = 'ok') as avg_messages
        from tutor_events where ${since}`),
      rows(sql`
        select
          count(*) as total,
          count(distinct install_hash) as installs,
          count(*) filter (where status = 'ok') as ok,
          percentile_cont(0.5) within group (order by ttft_ms) filter (where status = 'ok') as ttft_p50
        from tutor_events where ${prevWindow}`),
      rows(sql`
        with ${firsts}
        select
          count(*) filter (where first_at >= now() - make_interval(days => ${days})) as cur,
          count(*) filter (where first_at >= now() - make_interval(days => ${days * 2})
                             and first_at < now() - make_interval(days => ${days})) as prev
        from firsts`),
      rows(sql`
        select to_char(date_trunc('day', created_at at time zone 'UTC'), 'YYYY-MM-DD') as day,
          count(*) filter (where status = 'ok') as ok,
          count(*) filter (where status = 'rate_limited') as limited,
          count(*) filter (where status not in ('ok', 'rate_limited')) as failed,
          count(distinct install_hash) as installs,
          percentile_cont(0.5) within group (order by ttft_ms) filter (where status = 'ok') as ttft_p50,
          percentile_cont(0.95) within group (order by ttft_ms) filter (where status = 'ok') as ttft_p95,
          percentile_cont(0.5) within group (order by duration_ms) filter (where status = 'ok') as dur_p50,
          percentile_cont(0.95) within group (order by duration_ms) filter (where status = 'ok') as dur_p95
        from tutor_events where ${since}
        group by 1 order by 1`),
      rows(sql`
        with ${firsts}
        select to_char(date_trunc('day', first_at at time zone 'UTC'), 'YYYY-MM-DD') as day, count(*) as count
        from firsts where first_at >= now() - make_interval(days => ${days})
        group by 1`),
      rows(sql`
        select action, count(*) as count, count(distinct install_hash) as installs,
          count(*) filter (where status = 'ok') as ok,
          avg(message_count) as avg_messages,
          percentile_cont(0.5) within group (order by duration_ms) filter (where status = 'ok') as dur_p50
        from tutor_events where ${since} and ${NOT_SERVED}
        group by action order by count desc`),
      rows(sql`
        select problem_slug as slug, max(problem_id) as id, max(difficulty) as difficulty,
          count(*) as count, count(distinct install_hash) as installs,
          count(*) filter (where status = 'ok') as ok,
          to_char(max(created_at) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as last_at
        from tutor_events where ${since} and problem_slug is not null
        group by problem_slug order by count desc limit 12`),
      rows(sql`
        select coalesce(difficulty, 'Unknown') as difficulty, count(*) as count
        from tutor_events where ${since} and ${NOT_SERVED}
        group by 1 order by count desc`),
      rows(sql`
        select status, count(*) as count
        from tutor_events where ${since}
        group by status order by count desc`),
      rows(sql`
        select extract(isodow from created_at at time zone 'UTC')::int as dow,
          extract(hour from created_at at time zone 'UTC')::int as hour,
          count(*) as count
        from tutor_events where ${since}
        group by 1, 2`),
      rows(sql`
        select hint_level as level, count(*) as count
        from tutor_events
        where ${since} and ${NOT_SERVED} and action = 'hint' and hint_level is not null
        group by 1 order by 1`),
      rows(sql`
        select case when c = 1 then '1' when c <= 5 then '2–5' when c <= 20 then '6–20' else '21+' end as bucket,
          count(*) as installs
        from (
          select install_hash, count(*) as c from tutor_events
          where ${since} and ${NOT_SERVED} and install_hash is not null
          group by 1
        ) t group by 1`),
      rows(sql`
        select to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as at, status, http_status, action, problem_slug, duration_ms
        from tutor_events where ${since} and status <> 'ok'
        order by created_at desc limit 20`),
    ]);

  const k = kpiRows[0] || {};
  const p = prevRows[0] || {};
  const total = n(k.total) || 0;
  const prevTotal = n(p.total) || 0;

  // Fill in days with no traffic so charts have one point per day.
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const newByDay = new Map(dailyNew.map((d) => [d.day, n(d.count)]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
    const d = byDay.get(day);
    const ok = n(d?.ok) || 0;
    const limited = n(d?.limited) || 0;
    const failed = n(d?.failed) || 0;
    const all = ok + limited + failed;
    series.push({
      day,
      ok,
      limited,
      failed,
      total: all,
      successRate: all ? ok / all : null,
      installs: n(d?.installs) || 0,
      newInstalls: newByDay.get(day) || 0,
      ttftP50: n(d?.ttft_p50),
      ttftP95: n(d?.ttft_p95),
      durP50: n(d?.dur_p50),
      durP95: n(d?.dur_p95),
    });
  }

  // 7 × 24 grid, Monday first (ISO dow 1..7).
  const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const h of heat) heatmap[h.dow - 1][h.hour] = n(h.count);

  const engagementMap = new Map(engagement.map((e) => [e.bucket, n(e.installs)]));
  const installs = n(k.installs) || 0;
  const served = actions.reduce((s, a) => s + n(a.count), 0);

  return {
    kpis: {
      total,
      installs,
      newInstalls: n(newRows[0]?.cur) || 0,
      successRate: total ? n(k.ok) / total : null,
      rateLimited: n(k.rate_limited) || 0,
      errors: n(k.errors) || 0,
      ttftP50: n(k.ttft_p50),
      ttftP95: n(k.ttft_p95),
      durP50: n(k.dur_p50),
      durP95: n(k.dur_p95),
      avgChars: n(k.avg_chars),
      avgMessages: n(k.avg_messages),
      perInstall: installs ? served / installs : null,
    },
    prev: {
      total: prevTotal,
      installs: n(p.installs) || 0,
      newInstalls: n(newRows[0]?.prev) || 0,
      successRate: prevTotal ? n(p.ok) / prevTotal : null,
      ttftP50: n(p.ttft_p50),
    },
    series,
    heatmap,
    actions: actions.map((a) => ({
      action: a.action,
      count: n(a.count),
      installs: n(a.installs),
      successRate: n(a.count) ? n(a.ok) / n(a.count) : null,
      avgMessages: n(a.avg_messages),
      durP50: n(a.dur_p50),
    })),
    problems: problems.map((x) => ({
      ...x,
      count: n(x.count),
      installs: n(x.installs),
      successRate: n(x.count) ? n(x.ok) / n(x.count) : null,
    })),
    difficulty: difficulty.map((d) => ({ difficulty: d.difficulty, count: n(d.count) })),
    statuses: statuses.map((s) => ({ status: s.status, count: n(s.count) })),
    hints: hints.map((h) => ({ level: n(h.level), count: n(h.count) })),
    engagement: ENGAGEMENT_BUCKETS.map((bucket) => ({ bucket, installs: engagementMap.get(bucket) || 0 })),
    failures: failures.map((f) => ({ ...f, http_status: n(f.http_status), duration_ms: n(f.duration_ms) })),
  };
}
