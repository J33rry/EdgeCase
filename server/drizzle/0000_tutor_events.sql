CREATE TABLE "tutor_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"install_hash" text,
	"action" text NOT NULL,
	"problem_slug" text,
	"problem_id" text,
	"difficulty" text,
	"hint_level" integer,
	"message_count" integer,
	"model" text,
	"status" text NOT NULL,
	"http_status" integer NOT NULL,
	"ttft_ms" integer,
	"duration_ms" integer,
	"output_chars" integer
);
--> statement-breakpoint
CREATE INDEX "tutor_events_created_at_idx" ON "tutor_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tutor_events_install_hash_idx" ON "tutor_events" USING btree ("install_hash");