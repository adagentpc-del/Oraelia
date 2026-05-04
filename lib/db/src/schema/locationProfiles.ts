import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const locationProfilesTable = pgTable("location_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  city: text("city").notNull(),
  country: text("country").notNull(),
  locationType: text("location_type").notNull(),
  locationGoal: text("location_goal").notNull(),
  bestUse: text("best_use"),
  whatToDo: text("what_to_do"),
  whatNotToDo: text("what_not_to_do"),
  bestTimingStyle: text("best_timing_style"),
  recommendedPurpose: text("recommended_purpose"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLocationSchema = createInsertSchema(locationProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type LocationProfile = typeof locationProfilesTable.$inferSelect;
