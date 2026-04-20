import { Router } from "express";
import { db, requestsTable, donorsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateRequestBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (_req, res) => {
  const requests = await db
    .select()
    .from(requestsTable)
    .orderBy(desc(requestsTable.created_at));
  return res.json(requests.map(r => ({ ...r, created_at: r.created_at.toISOString() })));
});

router.post("/", async (req, res) => {
  const parsed = CreateRequestBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error });
  }

  const [donor] = await db
    .select()
    .from(donorsTable)
    .where(eq(donorsTable.id, parsed.data.donor_id));

  if (!donor) {
    return res.status(404).json({ error: "Donor not found" });
  }

  await db
    .update(donorsTable)
    .set({ total_requests_received: donor.total_requests_received + 1 })
    .where(eq(donorsTable.id, parsed.data.donor_id));

  const [request] = await db
    .insert(requestsTable)
    .values({ ...parsed.data, status: "pending" })
    .returning();

  return res.status(201).json({ ...request, created_at: request.created_at.toISOString() });
});

export default router;
