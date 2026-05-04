import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, locationProfilesTable } from "@workspace/db";
import { CreateLocationBody, UpdateLocationBody, GetLocationParams, UpdateLocationParams, DeleteLocationParams, GenerateLocationStrategyParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/locations", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) { res.json([]); return; }

  const locations = await db.select().from(locationProfilesTable)
    .where(eq(locationProfilesTable.userId, user.id));
  res.json(locations);
});

router.post("/locations", async (req, res): Promise<void> => {
  const parsed = CreateLocationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) { res.status(400).json({ error: "No user found" }); return; }

  const [loc] = await db.insert(locationProfilesTable).values({ userId: user.id, ...parsed.data }).returning();
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

  const goalStrategies: Record<string, { bestUse: string; whatToDo: string; whatNotToDo: string; bestTimingStyle: string; recommendedPurpose: string }> = {
    love: {
      bestUse: `${loc.city} holds romantic and relational energy for you. This is a place to open your heart and explore connection.`,
      whatToDo: "Explore social settings, attend cultural events, and be open to meeting new people. Practice vulnerability and presence.",
      whatNotToDo: "Avoid isolating yourself or bringing old relational patterns into new spaces. Do not rush connections.",
      bestTimingStyle: "Venus transits and new moon phases are ideal for love-focused visits. Stay at least two weeks for meaningful connections.",
      recommendedPurpose: "Romantic exploration, deepening existing relationships, or healing heart wounds.",
    },
    money: {
      bestUse: `${loc.city} supports your financial growth and professional visibility. Treat time here as an investment.`,
      whatToDo: "Network strategically, attend industry events, and present your work with confidence. Follow up on every connection.",
      whatNotToDo: "Avoid overspending to impress. Do not confuse social activity with productive networking.",
      bestTimingStyle: "Jupiter and Saturn transits favor financial moves here. Plan business trips during waxing moon phases.",
      recommendedPurpose: "Business development, career advancement, or launching financial ventures.",
    },
    visibility: {
      bestUse: `${loc.city} amplifies your presence and helps you be seen. This is your stage.`,
      whatToDo: "Share your work publicly, attend events where you can be noticed, and practice being visible without apologizing for it.",
      whatNotToDo: "Avoid hiding or playing small. Do not dim your light to make others comfortable.",
      bestTimingStyle: "Full moon periods and Leo season are powerful for visibility work. Short, high-impact visits work best.",
      recommendedPurpose: "Public speaking, launches, personal branding, and creative showcasing.",
    },
    healing: {
      bestUse: `${loc.city} is a restorative space for you. Come here when you need to recover, reflect, and rebuild.`,
      whatToDo: "Seek healing practitioners, spend time in nature, rest deeply, and journal extensively.",
      whatNotToDo: "Avoid filling your schedule. Do not bring work stress into this healing space.",
      bestTimingStyle: "Waning moon phases and Pisces season support deep healing. Stay for extended periods when possible.",
      recommendedPurpose: "Physical recovery, emotional processing, spiritual retreats, and nervous system regulation.",
    },
    rest: {
      bestUse: `${loc.city} is your sanctuary. This is where you come to simply be, without agenda or ambition.`,
      whatToDo: "Sleep deeply, eat well, move gently, disconnect from obligations, and let boredom lead you to creativity.",
      whatNotToDo: "Avoid screens, deadlines, and people who drain your energy. Do not feel guilty for doing nothing.",
      bestTimingStyle: "Visit during your personal low-energy periods. Seasonal transitions are especially powerful for rest resets.",
      recommendedPurpose: "Complete restoration, creative incubation, and reconnecting with your body's natural rhythms.",
    },
  };

  const strategy = goalStrategies[loc.locationGoal] || goalStrategies["rest"];

  const [updated] = await db.update(locationProfilesTable)
    .set(strategy)
    .where(eq(locationProfilesTable.id, params.data.id))
    .returning();

  res.json(updated);
});

export default router;
