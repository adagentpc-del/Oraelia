import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/** In-app reminder suggestions and scheduled notification intents. */
export const oraliaRemindersTable = pgTable("oralia_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  scheduledAt: text("scheduled_at").notNull(), // local ISO string; iOS schedules local notification from this
  localTimeLabel: text("local_time_label").notNull(),
  reminderType: text("reminder_type").notNull().default("power_hour"), // power_hour | goal | ritual | memory | custom
  relatedGoalId: integer("related_goal_id"),
  relatedMemoryId: integer("related_memory_id"),
  relatedLifeArea: text("related_life_area").notNull().default("general"),
  sound: text("sound").notNull().default("oralia_soft_chime"),
  repeatRule: text("repeat_rule"), // null | daily | weekly | weekdays | custom-later
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOraliaReminderSchema = createInsertSchema(oraliaRemindersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOraliaReminder = z.infer<typeof insertOraliaReminderSchema>;
export type OraliaReminder = typeof oraliaRemindersTable.$inferSelect;
