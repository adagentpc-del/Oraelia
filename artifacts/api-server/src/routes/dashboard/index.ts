import { Router, type IRouter } from "express";
import { requireUserId } from "../../lib/auth";
import { eq, desc, and } from "drizzle-orm";
import { db, usersTable, profilesTable, generatedGuidanceTable, generatedContentTable, dailyCheckinsTable, goalsTable, chakraAssessmentsTable, relationshipProfilesTable, locationProfilesTable } from "@workspace/db";
import { PROMPT_VERSIONS } from "../../lib/prompts";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));

  const today = new Date().toISOString().split("T")[0];

  const [cachedGuidance] = await db.select().from(generatedContentTable)
    .where(and(
      eq(generatedContentTable.userId, userId),
      eq(generatedContentTable.contentType, "daily_guidance"),
      eq(generatedContentTable.promptVersion, PROMPT_VERSIONS.daily_guidance),
      eq(generatedContentTable.referenceDate, today),
    ))
    .orderBy(desc(generatedContentTable.createdAt))
    .limit(1);

  let todayGuidance: Record<string, unknown> | null = null;
  if (cachedGuidance) {
    todayGuidance = {
      ...(cachedGuidance.content as Record<string, unknown>),
      id: cachedGuidance.id,
      isAiGenerated: cachedGuidance.isAiGenerated,
      cached: true,
    };
  } else {
    const [legacy] = await db.select().from(generatedGuidanceTable)
      .where(and(eq(generatedGuidanceTable.userId, userId), eq(generatedGuidanceTable.date, today)));
    if (legacy) todayGuidance = legacy as unknown as Record<string, unknown>;
  }

  const [latestCheckin] = await db.select().from(dailyCheckinsTable)
    .where(eq(dailyCheckinsTable.userId, userId))
    .orderBy(desc(dailyCheckinsTable.createdAt))
    .limit(1);

  const goals = await db.select().from(goalsTable)
    .where(eq(goalsTable.userId, userId));
  const activeGoals = goals.filter(g => g.status === "active");

  const allCheckins = await db.select().from(dailyCheckinsTable)
    .where(eq(dailyCheckinsTable.userId, userId))
    .orderBy(desc(dailyCheckinsTable.createdAt));

  let streak = 0;
  const now = new Date();
  for (let i = 0; i < allCheckins.length; i++) {
    const expectedDate = new Date(now);
    expectedDate.setDate(expectedDate.getDate() - i);
    const expected = expectedDate.toISOString().split("T")[0];
    if (allCheckins[i].date === expected) {
      streak++;
    } else {
      break;
    }
  }

  const [latestChakra] = await db.select().from(chakraAssessmentsTable)
    .where(eq(chakraAssessmentsTable.userId, userId))
    .orderBy(desc(chakraAssessmentsTable.createdAt))
    .limit(1);

  const relationships = await db.select().from(relationshipProfilesTable)
    .where(eq(relationshipProfilesTable.userId, userId));

  const locations = await db.select().from(locationProfilesTable)
    .where(eq(locationProfilesTable.userId, userId));

  const result: Record<string, unknown> = {
    userName: profile?.fullName || currentUser?.name || "there",
    hasProfile: !!profile,
    onboardingComplete: profile?.onboardingComplete || false,
    activeGoalsCount: activeGoals.length,
    checkinStreak: streak,
    totalCheckins: allCheckins.length,
    relationshipsCount: relationships.length,
    locationsCount: locations.length,
  };

  if (todayGuidance) result.todayGuidance = todayGuidance;
  if (latestCheckin) result.latestCheckin = latestCheckin;
  if (latestChakra) result.latestChakra = latestChakra;

  res.json(result);
});

export default router;
