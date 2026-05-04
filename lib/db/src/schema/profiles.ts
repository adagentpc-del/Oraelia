import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  fullName: text("full_name").notNull(),
  birthday: text("birthday").notNull(),
  birthTime: text("birth_time"),
  birthCity: text("birth_city"),
  currentCity: text("current_city"),
  relationshipStatus: text("relationship_status"),
  careerStage: text("career_stage"),
  topGoals: text("top_goals").array().notNull().default([]),
  currentChallenges: text("current_challenges"),
  guidanceCategories: text("guidance_categories").array().notNull().default([]),
  menstrualCycleTracking: boolean("menstrual_cycle_tracking").notNull().default(false),
  sleepTracking: boolean("sleep_tracking").notNull().default(false),
  spiritualOpenness: text("spiritual_openness"),
  guidanceTone: text("guidance_tone"),
  hdType: text("hd_type"),
  hdStrategy: text("hd_strategy"),
  hdAuthority: text("hd_authority"),
  hdProfile: text("hd_profile"),
  hdDefinedCenters: text("hd_defined_centers").array().notNull().default([]),
  hdKeyGates: text("hd_key_gates").array().notNull().default([]),
  sunSign: text("sun_sign"),
  lifePathNumber: integer("life_path_number"),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
