import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, usersTable, profilesTable, generatedGuidanceTable, dailyCheckinsTable, goalsTable, chakraAssessmentsTable, relationshipProfilesTable, locationProfilesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) {
    res.json({
      userName: "Guest",
      hasProfile: false,
      onboardingComplete: false,
      activeGoalsCount: 0,
      checkinStreak: 0,
      totalCheckins: 0,
      relationshipsCount: 0,
      locationsCount: 0,
    });
    return;
  }

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, user.id));

  const today = new Date().toISOString().split("T")[0];
  const [todayGuidance] = await db.select().from(generatedGuidanceTable)
    .where(and(eq(generatedGuidanceTable.userId, user.id), eq(generatedGuidanceTable.date, today)));

  const [latestCheckin] = await db.select().from(dailyCheckinsTable)
    .where(eq(dailyCheckinsTable.userId, user.id))
    .orderBy(desc(dailyCheckinsTable.createdAt))
    .limit(1);

  const goals = await db.select().from(goalsTable)
    .where(eq(goalsTable.userId, user.id));
  const activeGoals = goals.filter(g => g.status === "active");

  const allCheckins = await db.select().from(dailyCheckinsTable)
    .where(eq(dailyCheckinsTable.userId, user.id))
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
    .where(eq(chakraAssessmentsTable.userId, user.id))
    .orderBy(desc(chakraAssessmentsTable.createdAt))
    .limit(1);

  const relationships = await db.select().from(relationshipProfilesTable)
    .where(eq(relationshipProfilesTable.userId, user.id));

  const locations = await db.select().from(locationProfilesTable)
    .where(eq(locationProfilesTable.userId, user.id));

  const result: Record<string, unknown> = {
    userName: profile?.fullName || user.name,
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
