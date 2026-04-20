import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { donorsTable } from "./donors";

export const requestsTable = pgTable("requests", {
  id: serial("id").primaryKey(),
  donor_id: integer("donor_id").notNull().references(() => donorsTable.id),
  requester_identifier: text("requester_identifier").notNull(),
  status: text("status").notNull().default("pending"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertRequestSchema = createInsertSchema(requestsTable).omit({ id: true, created_at: true, status: true });
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type DonationRequest = typeof requestsTable.$inferSelect;
