import { Router, type IRouter } from "express";
import { requireUserId } from "../../lib/auth";
import { eq } from "drizzle-orm";
import { db, usersTable, goalsTable } from "@workspace/db";
import { CreateGoalBody, UpdateGoalBody, UpdateGoalParams, DeleteGoalParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/goals", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;

  const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId)).orderBy(goalsTable.createdAt);
  res.json(goals);
});

router.post("/goals", async (req, res): Promise<void> => {
  const parsed = CreateGoalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const userId = await requireUserId(req, res);
  if (userId === null) return;

  const [goal] = await db.insert(goalsTable).values({ userId: userId, ...parsed.data }).returning();
  res.status(201).json(goal);
});

router.patch("/goals/:id", async (req, res): Promise<void> => {
  const params = UpdateGoalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = UpdateGoalBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [goal] = await db.update(goalsTable).set(body.data).where(eq(goalsTable.id, params.data.id)).returning();
  if (!goal) { res.status(404).json({ error: "Goal not found" }); return; }
  res.json(goal);
});

router.delete("/goals/:id", async (req, res): Promise<void> => {
  const params = DeleteGoalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [goal] = await db.delete(goalsTable).where(eq(goalsTable.id, params.data.id)).returning();
  if (!goal) { res.status(404).json({ error: "Goal not found" }); return; }
  res.sendStatus(204);
});

export default router;
