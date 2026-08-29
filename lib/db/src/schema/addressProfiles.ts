import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/** Numerology and place-memory layer for homes, addresses, and moves. */
export const addressProfilesTable = pgTable("address_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  label: text("label").notNull().default("Current home"),
  addressInput: text("address_input").notNull(),
  addressNumber: integer("address_number").notNull(),
  context: text("context").notNull().default("address"), // address | phone | plate | custom
  locationType: text("location_type").notNull().default("current_home"), // current_home | past_home | prospective_home | vacation | work
  startDate: text("start_date"),
  endDate: text("end_date"),
  bestUse: text("best_use"),
  focusToday: text("focus_today"),
  watchOut: text("watch_out"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAddressProfileSchema = createInsertSchema(addressProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAddressProfile = z.infer<typeof insertAddressProfileSchema>;
export type AddressProfile = typeof addressProfilesTable.$inferSelect;
