import { Router, type IRouter } from "express";
import { requireUserId } from "../../lib/auth";
import { eq, and } from "drizzle-orm";
import { db, usersTable, generatedGuidanceTable } from "@workspace/db";
import { generateContent, getCachedContent } from "../../lib/ai-engine";

const router: IRouter = Router();

router.get("/guidance/today", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;

  const today = new Date().toISOString().split("T")[0];

  const cached = await getCachedContent(userId, "daily_guidance", today);
  if (cached) {
    res.json({ ...cached.content, id: cached.id, isAiGenerated: cached.isAiGenerated, promptVersion: cached.promptVersion, cached: true, createdAt: cached.createdAt });
    return;
  }

  const [legacy] = await db.select().from(generatedGuidanceTable)
    .where(and(eq(generatedGuidanceTable.userId, userId), eq(generatedGuidanceTable.date, today)));

  if (legacy) {
    res.json(legacy);
    return;
  }

  res.status(404).json({ error: "No guidance for today" });
});

router.post("/guidance/daily", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;

  const today = new Date().toISOString().split("T")[0];
  const forceRegenerate = req.body?.regenerate === true;

  const result = await generateContent({
    userId: userId,
    type: "daily_guidance",
    referenceDate: today,
    forceRegenerate,
  });

  res.json({
    ...result.content,
    id: result.id,
    isAiGenerated: result.isAiGenerated,
    promptVersion: result.promptVersion,
    cached: result.cached,
    createdAt: result.createdAt,
  });
});

router.post("/guidance/weekly", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  const weekKey = weekStart.toISOString().split("T")[0];
  const forceRegenerate = req.body?.regenerate === true;

  const result = await generateContent({
    userId: userId,
    type: "weekly_guidance",
    referenceDate: weekKey,
    forceRegenerate,
  });

  res.json({
    ...result.content,
    id: result.id,
    isAiGenerated: result.isAiGenerated,
    promptVersion: result.promptVersion,
    cached: result.cached,
    createdAt: result.createdAt,
  });
});

router.post("/guidance/monthly", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const forceRegenerate = req.body?.regenerate === true;

  const result = await generateContent({
    userId: userId,
    type: "monthly_guidance",
    referenceDate: monthKey,
    forceRegenerate,
  });

  res.json({
    ...result.content,
    id: result.id,
    isAiGenerated: result.isAiGenerated,
    promptVersion: result.promptVersion,
    cached: result.cached,
    createdAt: result.createdAt,
  });
});

export default router;
