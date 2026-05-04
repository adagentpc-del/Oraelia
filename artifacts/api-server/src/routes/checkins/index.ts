import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, dailyCheckinsTable } from "@workspace/db";
import { CreateCheckinBody, ListCheckinsQueryParams, GetCheckinParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/checkins", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) { res.json([]); return; }

  const query = ListCheckinsQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 30) : 30;

  const checkins = await db.select().from(dailyCheckinsTable)
    .where(eq(dailyCheckinsTable.userId, user.id))
    .orderBy(desc(dailyCheckinsTable.createdAt))
    .limit(limit);
  res.json(checkins);
});

router.post("/checkins", async (req, res): Promise<void> => {
  const parsed = CreateCheckinBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) { res.status(400).json({ error: "No user found" }); return; }

  const today = new Date().toISOString().split("T")[0];

  const [checkin] = await db.insert(dailyCheckinsTable).values({
    userId: user.id,
    date: today,
    ...parsed.data,
  }).returning();
  res.status(201).json(checkin);
});

router.get("/checkins/recent", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) { res.json([]); return; }

  const checkins = await db.select().from(dailyCheckinsTable)
    .where(eq(dailyCheckinsTable.userId, user.id))
    .orderBy(desc(dailyCheckinsTable.createdAt))
    .limit(14);
  res.json(checkins);
});

router.get("/checkins/:id", async (req, res): Promise<void> => {
  const params = GetCheckinParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [checkin] = await db.select().from(dailyCheckinsTable)
    .where(eq(dailyCheckinsTable.id, params.data.id));
  if (!checkin) { res.status(404).json({ error: "Check-in not found" }); return; }
  res.json(checkin);
});

export default router;
