import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const donorsTable = pgTable("donors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  blood_group: text("blood_group").notNull(),
  district: text("district").notNull(),
  whatsapp_number: text("whatsapp_number").notNull(),
  smoker: boolean("smoker").notNull().default(false),
  last_donation_date: text("last_donation_date"),
  is_willing_to_donate: boolean("is_willing_to_donate").notNull().default(true),
  total_requests_received: integer("total_requests_received").notNull().default(0),
  successful_donations: integer("successful_donations").notNull().default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertDonorSchema = createInsertSchema(donorsTable).omit({ id: true, created_at: true, total_requests_received: true, successful_donations: true });
export type InsertDonor = z.infer<typeof insertDonorSchema>;
export type Donor = typeof donorsTable.$inferSelect;
