import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contentLibraryTable = pgTable("content_library", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLibrarySchema = createInsertSchema(contentLibraryTable).omit({ id: true, createdAt: true });
export type InsertLibrary = z.infer<typeof insertLibrarySchema>;
export type ContentLibrary = typeof contentLibraryTable.$inferSelect;
