import { Router, type IRouter } from "express";
import { requireUserId } from "../../lib/auth";
import { eq } from "drizzle-orm";
import { db, usersTable, locationProfilesTable } from "@workspace/db";
import { CreateLocationBody, UpdateLocationBody, GetLocationParams, UpdateLocationParams, DeleteLocationParams, GenerateLocationStrategyParams } from "@workspace/api-zod";
import { generateContent, getCachedContent } from "../../lib/ai-engine";

const router: IRouter = Router();

router.get("/locations", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;

  const locations = await db.select().from(locationProfilesTable)
    .where(eq(locationProfilesTable.userId, userId));
  res.json(locations);
});

router.post("/locations", async (req, res): Promise<void> => {
  const parsed = CreateLocationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const userId = await requireUserId(req, res);
  if (userId === null) return;

  const [loc] = await db.insert(locationProfilesTable).values({ userId: userId, ...parsed.data }).returning();
  res.status(201).json(loc);
});

router.get("/locations/:id", async (req, res): Promise<void> => {
  const params = GetLocationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [loc] = await db.select().from(locationProfilesTable).where(eq(locationProfilesTable.id, params.data.id));
  if (!loc) { res.status(404).json({ error: "Location not found" }); return; }
  res.json(loc);
});

router.patch("/locations/:id", async (req, res): Promise<void> => {
  const params = UpdateLocationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = UpdateLocationBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [loc] = await db.update(locationProfilesTable).set(body.data).where(eq(locationProfilesTable.id, params.data.id)).returning();
  if (!loc) { res.status(404).json({ error: "Location not found" }); return; }
  res.json(loc);
});

router.delete("/locations/:id", async (req, res): Promise<void> => {
  const params = DeleteLocationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [loc] = await db.delete(locationProfilesTable).where(eq(locationProfilesTable.id, params.data.id)).returning();
  if (!loc) { res.status(404).json({ error: "Location not found" }); return; }
  res.sendStatus(204);
});

router.post("/locations/:id/strategy", async (req, res): Promise<void> => {
  const params = GenerateLocationStrategyParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [loc] = await db.select().from(locationProfilesTable).where(eq(locationProfilesTable.id, params.data.id));
  if (!loc) { res.status(404).json({ error: "Location not found" }); return; }

  const userId = await requireUserId(req, res);
  if (userId === null) return;

  const forceRegenerate = req.body?.regenerate === true;

  const extraContext = [
    `== LOCATION PROFILE ==`,
    `City: ${loc.city}`,
    `Country: ${loc.country}`,
    `Type: ${loc.locationType}`,
    `Goal: ${loc.locationGoal}`,
  ].join("\n");

  const result = await generateContent({
    userId: userId,
    type: "location_strategy",
    referenceId: loc.id,
    extraContext,
    forceRegenerate,
  });

  const strategy = result.content as Record<string, string>;
  const [updated] = await db.update(locationProfilesTable)
    .set({
      bestUse: strategy.bestUse,
      whatToDo: strategy.whatToDo,
      whatNotToDo: strategy.whatNotToDo,
      bestTimingStyle: strategy.bestTimingStyle,
      recommendedPurpose: strategy.recommendedPurpose,
    })
    .where(eq(locationProfilesTable.id, params.data.id))
    .returning();

  res.json(updated);
});

export default router;
