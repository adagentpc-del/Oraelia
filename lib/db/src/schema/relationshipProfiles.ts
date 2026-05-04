import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const relationshipProfilesTable = pgTable("relationship_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  personName: text("person_name").notNull(),
  relationshipType: text("relationship_type").notNull(),
  birthday: text("birthday"),
  birthTime: text("birth_time"),
  birthCity: text("birth_city"),
  communicationStyle: text("communication_style"),
  attachmentStyle: text("attachment_style"),
  conflictStyle: text("conflict_style"),
  loveLanguage: text("love_language"),
  currentDynamic: text("current_dynamic"),
  communicationPattern: text("communication_pattern"),
  emotionalActivation: text("emotional_activation"),
  repairLanguage: text("repair_language"),
  conflictPattern: text("conflict_pattern"),
  greenFlags: text("green_flags"),
  redFlags: text("red_flags"),
  bestCommunication: text("best_communication"),
  bestTiming: text("best_timing"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRelationshipSchema = createInsertSchema(relationshipProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type RelationshipProfile = typeof relationshipProfilesTable.$inferSelect;
