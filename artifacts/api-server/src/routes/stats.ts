import { Router } from "express";
import { db, donorsTable, requestsTable, verificationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/summary", async (_req, res) => {
  const [totalDonors] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(donorsTable);

  const [willingDonors] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(donorsTable)
    .where(eq(donorsTable.is_willing_to_donate, true));

  const [totalRequests] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(requestsTable);

  const [completedDonations] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(requestsTable)
    .where(eq(requestsTable.status, "completed"));

  const [pendingVerifications] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(verificationsTable)
    .where(eq(verificationsTable.verification_status, "pending"));

  return res.json({
    total_donors: totalDonors?.count ?? 0,
    willing_donors: willingDonors?.count ?? 0,
    total_requests: totalRequests?.count ?? 0,
    completed_donations: completedDonations?.count ?? 0,
    pending_verifications: pendingVerifications?.count ?? 0,
  });
});

router.get("/blood-groups", async (_req, res) => {
  const stats = await db
    .select({
      blood_group: donorsTable.blood_group,
      count: sql<number>`count(*)::int`,
    })
    .from(donorsTable)
    .groupBy(donorsTable.blood_group)
    .orderBy(donorsTable.blood_group);

  return res.json(stats);
});

export default router;
