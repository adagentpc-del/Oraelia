import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, insertOraliaReminderSchema, oraliaRemindersTable } from "@workspace/db";
import { requireUserId } from "../../lib/auth";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

router.get("/reminders", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const reminders = await db
    .select()
    .from(oraliaRemindersTable)
    .where(eq(oraliaRemindersTable.userId, birth.userId))
    .orderBy(desc(oraliaRemindersTable.scheduledAt));
  res.json({ reminders });
});

router.post("/reminders", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const parsed = insertOraliaReminderSchema.omit({ userId: true }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db
    .insert(oraliaRemindersTable)
    .values({ ...parsed.data, userId: birth.userId })
    .returning();
  res.status(201).json(created);
});

router.patch("/reminders/:id", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const id = parseInt(req.params.id ?? "", 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid reminder id" });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const patch: Partial<typeof oraliaRemindersTable.$inferInsert> = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.body === "string") patch.body = body.body;
  if (typeof body.scheduledAt === "string") patch.scheduledAt = body.scheduledAt;
  if (typeof body.localTimeLabel === "string") patch.localTimeLabel = body.localTimeLabel;
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  if (typeof body.repeatRule === "string" || body.repeatRule === null) patch.repeatRule = body.repeatRule;
  const [updated] = await db
    .update(oraliaRemindersTable)
    .set(patch)
    .where(and(eq(oraliaRemindersTable.id, id), eq(oraliaRemindersTable.userId, birth.userId)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }
  res.json(updated);
});

export default router;
