import { bigserial, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// One row per /api/tutor request. Metadata only: no chat text, no code, no IP.
export const tutorEvents = pgTable(
  "tutor_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    installHash: text("install_hash"), // sha256(installId + ANALYTICS_SALT)
    action: text("action").notNull(), // explain | example | hint | pattern | complexity | edges | approach | code | chat
    problemSlug: text("problem_slug"),
    problemId: text("problem_id"),
    difficulty: text("difficulty"),
    hintLevel: integer("hint_level"),
    messageCount: integer("message_count"),
    model: text("model"),
    status: text("status").notNull(), // ok | provider_error | stream_error | rate_limited | invalid | aborted
    httpStatus: integer("http_status").notNull(),
    ttftMs: integer("ttft_ms"),
    durationMs: integer("duration_ms"),
    outputChars: integer("output_chars"),
  },
  (t) => [index("tutor_events_created_at_idx").on(t.createdAt), index("tutor_events_install_hash_idx").on(t.installHash)],
);
