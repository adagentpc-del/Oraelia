import { pgTable, text, serial, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const generatedContentTable = pgTable("generated_content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  contentType: text("content_type").notNull(),
  promptVersion: text("prompt_version").notNull(),
  referenceDate: text("reference_date"),
  referenceId: integer("reference_id"),
  content: jsonb("content").notNull(),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_gc_lookup").on(table.userId, table.contentType, table.promptVersion, table.referenceDate),
  index("idx_gc_ref_lookup").on(table.userId, table.contentType, table.promptVersion, table.referenceId),
]);

export const insertGeneratedContentSchema = createInsertSchema(generatedContentTable).omit({ id: true, createdAt: true });
export type InsertGeneratedContent = z.infer<typeof insertGeneratedContentSchema>;
export type GeneratedContent = typeof generatedContentTable.$inferSelect;
