import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * One-time authentication tokens (password reset, email verification).
 * Only the SHA-256 hash of the token is stored — the raw token exists
 * solely in the email sent to the user.
 */
export const authTokensTable = pgTable("auth_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: text("type").notNull(), // password_reset | email_verify
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuthToken = typeof authTokensTable.$inferSelect;
