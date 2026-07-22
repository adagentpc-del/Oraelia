import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/**
 * Longitudinal pattern intelligence: user-logged life events that can be
 * compared against transits, profections, and numerology cycles.
 */
export const lifeEventsTable = pgTable("life_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  eventType: text("event_type").notNull(), // relationship_start, promotion, launch, move, etc.
  eventDate: text("event_date").notNull(), // YYYY-MM-DD
  description: text("description"),
  category: text("category"), // love | career | money | family | health | visibility | other
  intensity: integer("intensity"), // 1-10 subjective significance
  outcome: text("outcome"), // positive | negative | mixed | ongoing
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLifeEventSchema = createInsertSchema(lifeEventsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLifeEvent = z.infer<typeof insertLifeEventSchema>;
export type LifeEvent = typeof lifeEventsTable.$inferSelect;
