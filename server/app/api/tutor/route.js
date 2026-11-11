import { getClient, MODEL, MAX_OUTPUT_TOKENS } from "@/lib/ai";
import { buildMessages, validateBody } from "@/lib/prompt";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accepts "chrome-extension://<id>", a bare extension id, or a pasted
// "chrome://extensions/?id=<id>" link, and normalizes them to the origin.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => {
    if (s === "*" || /^https?:\/\//.test(s)) return s.replace(/\/$/, "");
    const id = s.match(/\b([a-p]{32})\b/)?.[1];
    return id ? `chrome-extension://${id}` : s;
  });

if (!allowedOrigins.length) {
  console.warn("ALLOWED_ORIGINS is empty, so every extension request will be rejected.");
}

function corsHeaders(origin) {
  const ok = origin && (allowedOrigins.includes(origin) || allowedOrigins.includes("*"));
  return ok
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
      }
    : null;
}

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export async function OPTIONS(req) {
  const cors = corsHeaders(req.headers.get("origin"));
  return new Response(null, { status: cors ? 204 : 403, headers: cors || {} });
}

export async function POST(req) {
  const cors = corsHeaders(req.headers.get("origin"));
  if (!cors) return json(403, { error: "Origin not allowed." });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body." }, cors);
  }
  const invalid = validateBody(body);
  if (invalid) return json(400, { error: invalid }, cors);

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  const installId = typeof body.installId === "string" ? body.installId.slice(0, 64) : "";
  const limit = Number(process.env.RATE_LIMIT_PER_HOUR) || 40;
  const rl = checkRateLimit([`ip:${ip}`, installId && `id:${installId}`], limit);
  if (!rl.ok) {
    return json(
      429,
      { error: `Rate limit reached. Try again in ${Math.ceil(rl.retryAfter / 60)} min.` },
      { ...cors, "Retry-After": String(rl.retryAfter) },
    );
  }

  let upstream;
  try {
    const tokenParam = process.env.MAX_TOKENS_PARAM || "max_tokens";
    upstream = await getClient().chat.completions.create({
      model: MODEL,
      messages: buildMessages(body),
      stream: true,
      [tokenParam]: MAX_OUTPUT_TOKENS,
    });
  } catch (err) {
    console.error("AI provider error:", err?.status, err?.message);
    const status = err?.status === 429 ? 429 : 502;
    const error =
      status === 429 ? "The AI provider is busy. Try again shortly." : "The AI provider request failed.";
    return json(status, { error }, cors);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of upstream) {
          const text = chunk.choices?.[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        console.error("AI stream error:", err?.message);
        controller.enqueue(encoder.encode("\n\n_(The response was interrupted. Please try again.)_"));
      } finally {
        controller.close();
      }
    },
    cancel() {
      upstream.controller?.abort();
    },
  });

  return new Response(stream, {
    headers: { ...cors, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
