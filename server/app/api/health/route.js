// Liveness probe for uptime monitors (e.g. UptimeRobot). Pinging this every
// few minutes keeps the Render free-tier instance from spinning down.
// Deliberately touches no database, Redis or AI provider, so frequent pings
// cost nothing and never wake or bill those services.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startedAt = Date.now();

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store, max-age=0",
};

export function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      uptime: Math.round((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    }),
    { status: 200, headers },
  );
}

// UptimeRobot's HTTP monitors send HEAD requests by default.
export function HEAD() {
  return new Response(null, { status: 200, headers });
}
