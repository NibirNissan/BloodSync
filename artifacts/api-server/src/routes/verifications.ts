import { Router } from "express";
import { db, verificationsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { CreateVerificationBody } from "@workspace/api-zod";

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

export default router;
