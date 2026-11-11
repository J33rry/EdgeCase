import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let db;

// Returns the Drizzle client, or null when DATABASE_URL isn't set
// (analytics is then skipped and the dashboard shows an empty state).
export function getDb() {
  if (!process.env.DATABASE_URL) return null;
  db ??= drizzle(neon(process.env.DATABASE_URL), { schema });
  return db;
}

export { schema };
