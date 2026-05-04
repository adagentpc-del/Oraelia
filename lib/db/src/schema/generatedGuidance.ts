import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const generatedGuidanceTable = pgTable("generated_guidance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  date: text("date").notNull(),
  theme: text("theme").notNull(),
  bestUse: text("best_use").notNull(),
  avoid: text("avoid").notNull(),
  career: text("career").notNull(),
  relationship: text("relationship").notNull(),
  body: text("body").notNull(),
  chakra: text("chakra").notNull(),
  moon: text("moon").notNull(),
  goalNudge: text("goal_nudge").notNull(),
  action: text("action").notNull(),
  journalPrompt: text("journal_prompt").notNull(),
  ritual: text("ritual").notNull(),
  promptVersion: text("prompt_version"),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGuidanceSchema = createInsertSchema(generatedGuidanceTable).omit({ id: true, createdAt: true });
export type InsertGuidance = z.infer<typeof insertGuidanceSchema>;
export type GeneratedGuidance = typeof generatedGuidanceTable.$inferSelect;
