import { Router } from "express";
import { db, donorsTable, requestsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  ListDonorsQueryParams,
  CreateDonorBody,
  GetDonorParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const parsed = ListDonorsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }

  const { blood_group, district, is_willing_to_donate } = parsed.data;

  let query = db.select().from(donorsTable).$dynamic();

  if (blood_group) {
    query = query.where(eq(donorsTable.blood_group, blood_group));
  }
  if (district) {
    query = query.where(eq(donorsTable.district, district));
  }
  if (is_willing_to_donate !== undefined) {
    query = query.where(eq(donorsTable.is_willing_to_donate, is_willing_to_donate));
  }

  const donors = await query.orderBy(desc(donorsTable.created_at));
  return res.json(donors.map(d => ({ ...d, created_at: d.created_at.toISOString() })));
});

router.post("/", async (req, res) => {
  const parsed = CreateDonorBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error });
  }

  const [donor] = await db.insert(donorsTable).values(parsed.data).returning();
  return res.status(201).json({ ...donor, created_at: donor.created_at.toISOString() });
});

router.get("/top", async (req, res) => {
  const donors = await db
    .select()
    .from(donorsTable)
    .orderBy(desc(donorsTable.successful_donations))
    .limit(10);
  return res.json(donors.map(d => ({ ...d, created_at: d.created_at.toISOString() })));
});

router.get("/:id", async (req, res) => {
  const parsed = GetDonorParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const [donor] = await db
    .select()
    .from(donorsTable)
    .where(eq(donorsTable.id, parsed.data.id));

  if (!donor) {
    return res.status(404).json({ error: "Donor not found" });
  }

  return res.json({ ...donor, created_at: donor.created_at.toISOString() });
});

export default router;
