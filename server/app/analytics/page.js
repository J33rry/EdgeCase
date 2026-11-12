import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/adminAuth";
import { getDashboard, RANGES } from "@/lib/analyticsQueries";
import { logout } from "./actions";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics · EdgeCase", robots: { index: false, follow: false } };

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

  const now = new Date().toISOString().slice(11, 16);

  return (
    <main className="a-page">
      <header className="a-header">
        <div className="a-brand">
          <div className="a-logo" aria-hidden>
            EC
          </div>
          <div>
            <h1>Tutor analytics</h1>
            <p>
              <span className="a-live" />
              Last {days} days vs the {days} before · updated {now} UTC
            </p>
          </div>
        </div>
        <nav className="a-seg" aria-label="Date range">
          {RANGES.map((d) => (
            <Link key={d} href={`/analytics?days=${d}`} className={d === days ? "on" : ""} aria-current={d === days ? "page" : undefined}>
              {d} days
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <button className="a-btn">Sign out</button>
        </form>
      </header>

      {loadError && <div className="a-notice bad">{loadError}</div>}
      {!loadError && !data && (
        <div className="a-notice">
          No database configured. Set <code>DATABASE_URL</code> to your Neon connection string and run{" "}
          <code>npm run db:migrate -w server</code>.
        </div>
      )}
      {data && data.kpis.total === 0 && <div className="a-notice">No tutor requests in the last {days} days yet.</div>}
      {data && data.kpis.total > 0 && <Dashboard data={data} days={days} />}
    </main>
  );
}

