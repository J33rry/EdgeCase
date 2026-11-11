import { after } from "next/server";
import { getClient, MODEL, MAX_OUTPUT_TOKENS } from "@/lib/ai";
import { eventBase, recordEvent } from "@/lib/analytics";
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
  const t0 = Date.now();
  const cors = corsHeaders(req.headers.get("origin"));
  if (!cors) return json(403, { error: "Origin not allowed." });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body." }, cors);
  }
  // Analytics rows are written after the response is sent (after() keeps the
  // function alive on Vercel), so they never slow the reply down.
  const base = eventBase(body);
  const track = (fields) => after(() => recordEvent({ ...base, ...fields }));

  const invalid = validateBody(body);
  if (invalid) {
    track({ status: "invalid", httpStatus: 400 });
    return json(400, { error: invalid }, cors);
  }

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  const installId = typeof body.installId === "string" ? body.installId.slice(0, 64) : "";
  const limit = Number(process.env.RATE_LIMIT_PER_HOUR) || 40;
  const rl = await checkRateLimit([`ip:${ip}`, installId && `id:${installId}`], limit);
  if (!rl.ok) {
    track({ status: "rate_limited", httpStatus: 429 });
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
    track({ status: "provider_error", httpStatus: status, durationMs: Date.now() - t0 });
    return json(status, { error }, cors);
  }

  // Resolved once the stream ends, with the outcome to record.
  let settle;
  const finished = new Promise((resolve) => (settle = resolve));
  after(() => finished.then((fields) => recordEvent({ ...base, httpStatus: 200, ...fields })));

  let ttftMs = null;
  let outputChars = 0;
  const outcome = (status) => ({ status, ttftMs, outputChars, durationMs: Date.now() - t0 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let status = "ok";
      try {
        for await (const chunk of upstream) {
          const text = chunk.choices?.[0]?.delta?.content;
          if (text) {
            ttftMs ??= Date.now() - t0;
            outputChars += text.length;
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (err) {
        if (upstream.controller?.signal?.aborted) {
          status = "aborted";
        } else {
          status = "stream_error";
          console.error("AI stream error:", err?.message);
          controller.enqueue(encoder.encode("\n\n_(The response was interrupted. Please try again.)_"));
        }
      } finally {
        settle(outcome(status));
        try {
          controller.close();
        } catch {
          /* already closed by cancel() */
        }
      }
    },
    cancel() {
      settle(outcome("aborted"));
      upstream.controller?.abort();
    },
  });

  return new Response(stream, {
    headers: { ...cors, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
