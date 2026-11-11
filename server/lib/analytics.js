import { createHash } from "node:crypto";
import { getDb, schema } from "@/db";
import { MODEL } from "@/lib/ai";

export const ACTIONS = ["explain", "example", "hint", "pattern", "complexity", "edges", "approach", "code", "chat"];

export const cleanAction = (a) => (ACTIONS.includes(a) ? a : "chat");

const clip = (s, n) => (typeof s === "string" && s ? s.slice(0, n) : null);

function hashInstall(id) {
  if (!id) return null;
  return createHash("sha256")
    .update(`${process.env.ANALYTICS_SALT || "edgecase"}:${id}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Pulls the metadata we keep out of a request body. Never copies chat text or code.
 */
export function eventBase(body) {
  const p = body && typeof body.problem === "object" && body.problem ? body.problem : {};
  return {
    installHash: hashInstall(typeof body?.installId === "string" ? body.installId.slice(0, 64) : ""),
    action: cleanAction(body?.action),
    problemSlug: clip(p.slug, 100),
    problemId: clip(p.id, 10),
    difficulty: clip(p.difficulty, 20),
    hintLevel: Number.isInteger(body?.hintLevel) ? body.hintLevel : null,
    messageCount: Array.isArray(body?.messages) ? body.messages.length : null,
  };
}

/** Inserts one tutor_events row. Never throws; does nothing without DATABASE_URL. */
export async function recordEvent(fields) {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(schema.tutorEvents).values({ model: MODEL, ...fields });
  } catch (err) {
    console.error("Analytics insert failed:", err?.message);
  }
}
