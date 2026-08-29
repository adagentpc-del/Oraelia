import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/**
 * Raw daily brain dumps. These preserve what the user actually said or typed
 * before Oralia extracts candidate memories and daily plan adjustments.
 */
export const brainDumpsTable = pgTable("brain_dumps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  date: text("date").notNull(),
  inputMode: text("input_mode").notNull().default("text"), // text | voice_transcript
  rawText: text("raw_text").notNull(),
  extractedSummary: text("extracted_summary").notNull(),
  primaryLifeArea: text("primary_life_area").notNull().default("general"),
  emotion: text("emotion"),
  urgency: text("urgency").notNull().default("normal"), // low | normal | high
  extractedGoals: jsonb("extracted_goals").$type<string[]>().notNull().default([]),
  extractedPeople: jsonb("extracted_people").$type<string[]>().notNull().default([]),
  extractedPlaces: jsonb("extracted_places").$type<string[]>().notNull().default([]),
  shouldCreateMemory: boolean("should_create_memory").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBrainDumpSchema = createInsertSchema(brainDumpsTable).omit({ id: true, createdAt: true });
export type InsertBrainDump = z.infer<typeof insertBrainDumpSchema>;
export type BrainDump = typeof brainDumpsTable.$inferSelect;
