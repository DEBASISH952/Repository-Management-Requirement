import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  category: text("category").notNull(), // Brand or Tactical
  assetType: text("asset_type").notNull(), // Static, Carousel, Video, Emailer
  region: text("region").notNull(),
  state: text("state").notNull(),
  resort: text("resort"),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  version: integer("version").notNull().default(1),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  googleDriveFileId: text("google_drive_file_id").notNull(),
  googleDriveFolderId: text("google_drive_folder_id").notNull(),
  driveLink: text("drive_link").notNull(),
  versionsLink: text("versions_link"),
  thumbnailUrl: text("thumbnail_url"),
  tags: jsonb("tags").$type<string[]>().default([]),
  isFavorite: boolean("is_favorite").default(false),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  uploadDate: true,
  updatedAt: true,
});

export const updateAssetSchema = insertAssetSchema.partial().extend({
  id: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type UpdateAsset = z.infer<typeof updateAssetSchema>;
