import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const chakraAssessmentsTable = pgTable("chakra_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  root: integer("root").notNull(),
  sacral: integer("sacral").notNull(),
  solarPlexus: integer("solar_plexus").notNull(),
  heart: integer("heart").notNull(),
  throat: integer("throat").notNull(),
  thirdEye: integer("third_eye").notNull(),
  crown: integer("crown").notNull(),
  strongestChakra: text("strongest_chakra"),
  lowestChakra: text("lowest_chakra"),
  recommendedPractice: text("recommended_practice"),
  journalPrompt: text("journal_prompt"),
  affirmation: text("affirmation"),
  somaticAction: text("somatic_action"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChakraSchema = createInsertSchema(chakraAssessmentsTable).omit({ id: true, createdAt: true });
export type InsertChakra = z.infer<typeof insertChakraSchema>;
export type ChakraAssessment = typeof chakraAssessmentsTable.$inferSelect;
