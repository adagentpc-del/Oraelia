import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const dailyCheckinsTable = pgTable("daily_checkins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  date: text("date").notNull(),
  mood: integer("mood").notNull(),
  energy: integer("energy").notNull(),
  stress: integer("stress").notNull(),
  sleepQuality: integer("sleep_quality").notNull(),
  movement: text("movement"),
  socialActivity: text("social_activity"),
  cyclePhase: text("cycle_phase"),
  notes: text("notes"),
  whatHappened: text("what_happened"),
  whatFeltAligned: text("what_felt_aligned"),
  whatFeltDraining: text("what_felt_draining"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCheckinSchema = createInsertSchema(dailyCheckinsTable).omit({ id: true, createdAt: true });
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;
export type DailyCheckin = typeof dailyCheckinsTable.$inferSelect;
