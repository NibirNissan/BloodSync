import { Router } from "express";
import { db, verificationsTable, donorsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { CreateVerificationBody, UpdateVerificationBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (_req, res) => {
  const verifications = await db
    .select()
    .from(verificationsTable)
    .orderBy(desc(verificationsTable.created_at));
  return res.json(verifications.map(v => ({ ...v, created_at: v.created_at.toISOString() })));
});

router.post("/", async (req, res) => {
  const parsed = CreateVerificationBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error });
  }

  const [verification] = await db
    .insert(verificationsTable)
    .values({ ...parsed.data, verification_status: "pending" })
    .returning();

  return res.status(201).json({ ...verification, created_at: verification.created_at.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const body = UpdateVerificationBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "Invalid body", details: body.error });
  }

  const [existing] = await db
    .select()
    .from(verificationsTable)
    .where(eq(verificationsTable.id, id));

  if (!existing) {
    return res.status(404).json({ error: "Verification not found" });
  }

  const [updated] = await db
    .update(verificationsTable)
    .set({ verification_status: body.data.verification_status })
    .where(eq(verificationsTable.id, id))
    .returning();

  // If approving: increment the donor's successful_donations counter
  if (body.data.verification_status === "verified" && existing.verification_status !== "verified") {
    await db
      .update(donorsTable)
      .set({ successful_donations: sql`${donorsTable.successful_donations} + 1` })
      .where(eq(donorsTable.id, existing.donor_id));
  }

  // If un-approving (reverting from verified to rejected): decrement
  if (body.data.verification_status === "rejected" && existing.verification_status === "verified") {
    await db
      .update(donorsTable)
      .set({ successful_donations: sql`GREATEST(${donorsTable.successful_donations} - 1, 0)` })
      .where(eq(donorsTable.id, existing.donor_id));
  }

  return res.json({ ...updated, created_at: updated.created_at.toISOString() });
});

export default router;
