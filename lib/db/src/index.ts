import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

import { sql } from "drizzle-orm";

export type Db = typeof db;

/**
 * Runs queries inside a transaction with the Postgres `app.user_id` GUC set,
 * activating the row-level-security policies in lib/db/rls.sql. Opt-in
 * defense-in-depth beneath application-level scoping: once rls.sql is
 * applied, queries outside runAsUser/runAsSystem return no user rows.
 */
export async function runAsUser<T>(userId: number, fn: (tx: Db) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.user_id', ${String(userId)}, true)`);
    return fn(tx as unknown as Db);
  });
}

/** System context for auth flows (login by email, registration) under RLS. */
export async function runAsSystem<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.system', 'on', true)`);
    return fn(tx as unknown as Db);
  });
}

export * from "./schema";
