import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { donorsTable } from "./donors";

export const verificationsTable = pgTable("donations_verification", {
  id: serial("id").primaryKey(),
  donor_id: integer("donor_id").notNull().references(() => donorsTable.id),
  recipient_details: text("recipient_details").notNull(),
  proof_document_url: text("proof_document_url"),
  verification_status: text("verification_status").notNull().default("pending"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertVerificationSchema = createInsertSchema(verificationsTable).omit({ id: true, created_at: true, verification_status: true });
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type DonationVerification = typeof verificationsTable.$inferSelect;
