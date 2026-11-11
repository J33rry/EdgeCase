import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export const RANGES = [7, 30, 90];

const n = (v) => (v == null ? null : Number(v));

/**
 * Everything the /analytics page shows for the last `days` days.
 * Returns null when DATABASE_URL isn't set.
 */
export async function getDashboard(days) {
  const db = getDb();
  if (!db) return null;

  const since = sql`created_at >= now() - make_interval(days => ${days})`;
  const rows = async (query) => (await db.execute(query)).rows;

  const [kpiRows, daily, actions, problems, difficulty, failures] = await Promise.all([
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
        avg(output_chars) filter (where status = 'ok') as avg_chars
      from tutor_events where ${since}`),
    rows(sql`
      select to_char(date_trunc('day', created_at at time zone 'UTC'), 'YYYY-MM-DD') as day,
        count(*) filter (where status = 'ok') as ok,
        count(*) filter (where status <> 'ok') as failed
      from tutor_events where ${since}
      group by 1 order by 1`),
    rows(sql`
      select action, count(*) as count, count(distinct install_hash) as installs
      from tutor_events where ${since} and status not in ('invalid', 'rate_limited')
      group by action order by count desc`),
    rows(sql`
      select problem_slug as slug, max(problem_id) as id, max(difficulty) as difficulty,
        count(*) as count, count(distinct install_hash) as installs
      from tutor_events where ${since} and problem_slug is not null
      group by problem_slug order by count desc limit 10`),
    rows(sql`
      select coalesce(difficulty, 'Unknown') as difficulty, count(*) as count
      from tutor_events where ${since} and status not in ('invalid', 'rate_limited')
      group by 1 order by count desc`),
    rows(sql`
      select to_char(created_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS') as at, status, http_status, action, problem_slug, duration_ms
      from tutor_events where ${since} and status <> 'ok'
      order by created_at desc limit 20`),
  ]);

  const k = kpiRows[0] || {};
  const total = n(k.total) || 0;

  // Fill in days with no traffic so the chart has one bar per day.
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const d = byDay.get(day);
    series.push({ day, ok: n(d?.ok) || 0, failed: n(d?.failed) || 0 });
  }

  return {
    kpis: {
      total,
      installs: n(k.installs) || 0,
      successRate: total ? n(k.ok) / total : null,
      rateLimited: n(k.rate_limited) || 0,
      errors: n(k.errors) || 0,
      ttftP50: n(k.ttft_p50),
      ttftP95: n(k.ttft_p95),
      durP50: n(k.dur_p50),
      durP95: n(k.dur_p95),
      avgChars: n(k.avg_chars),
    },
    series,
    actions: actions.map((a) => ({ action: a.action, count: n(a.count), installs: n(a.installs) })),
    problems: problems.map((p) => ({ ...p, count: n(p.count), installs: n(p.installs) })),
    difficulty: difficulty.map((d) => ({ difficulty: d.difficulty, count: n(d.count) })),
    failures: failures.map((f) => ({ ...f, http_status: n(f.http_status), duration_ms: n(f.duration_ms) })),
  };
}
