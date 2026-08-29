import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/**
 * Persistent Oralia memory.
 *
 * These are user-owned, editable memory atoms extracted from brain dumps,
 * life events, relationships, moves, address changes, goals, reminders, and
 * manually logged observations. They are the foundation for Oralia's
 * longitudinal "Today / Memory / Overall" intelligence model.
 */
export const memoryItemsTable = pgTable("memory_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  sourceType: text("source_type").notNull().default("manual"), // brain_dump | life_event | reminder | address | relationship | move | vacation | manual
  sourceId: integer("source_id"),
  memoryType: text("memory_type").notNull().default("observation"), // event | pattern | preference | goal | relationship | place | address | reminder | observation
  lifeArea: text("life_area").notNull().default("general"), // career | relationship | money | health | home | travel | creativity | visibility | general
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  eventDate: text("event_date"), // YYYY-MM-DD when the memory belongs to a date; null for evergreen memories
  emotion: text("emotion"),
  people: jsonb("people").$type<string[]>().notNull().default([]),
  places: jsonb("places").$type<string[]>().notNull().default([]),
  goals: jsonb("goals").$type<string[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  confidence: integer("confidence").notNull().default(60),
  active: boolean("active").notNull().default(true),
  userConfirmed: boolean("user_confirmed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMemoryItemSchema = createInsertSchema(memoryItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMemoryItem = z.infer<typeof insertMemoryItemSchema>;
export type MemoryItem = typeof memoryItemsTable.$inferSelect;
