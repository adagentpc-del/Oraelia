import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, dailyCheckinsTable } from "@workspace/db";
import { generateContent } from "../../lib/ai-engine";

const router: IRouter = Router();

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function computeBasePatterns(checkins: Array<{ date: string; mood: number; energy: number; stress: number; sleepQuality: number; movement: string | null; socialActivity: string | null }>) {
  const total = checkins.length;
  if (total === 0) return null;

  const avgMood = checkins.reduce((s, c) => s + c.mood, 0) / total;
  const avgEnergy = checkins.reduce((s, c) => s + c.energy, 0) / total;
  const avgStress = checkins.reduce((s, c) => s + c.stress, 0) / total;
  const avgSleepQuality = checkins.reduce((s, c) => s + c.sleepQuality, 0) / total;

  const dayScores: Record<number, { total: number; count: number }> = {};
  for (const c of checkins) {
    const day = new Date(c.date).getDay();
    if (!dayScores[day]) dayScores[day] = { total: 0, count: 0 };
    dayScores[day].total += c.mood + c.energy - c.stress;
    dayScores[day].count++;
  }

  let bestDay = 0;
  let worstDay = 0;
  let bestScore = -Infinity;
  let worstScore = Infinity;
  for (const [day, data] of Object.entries(dayScores)) {
    const avg = data.total / data.count;
    if (avg > bestScore) { bestScore = avg; bestDay = parseInt(day); }
    if (avg < worstScore) { worstScore = avg; worstDay = parseInt(day); }
  }

  const warnings: string[] = [];
  if (avgStress > 6) warnings.push("Consistently high stress levels detected. Consider adding stress-reduction practices.");
  if (avgSleepQuality < 5) warnings.push("Sleep quality is below optimal. Poor sleep compounds energy drain.");
  if (avgEnergy < 4) warnings.push("Low energy pattern emerging. Check nutrition, movement, and rest quality.");

  return {
    avgMood: Math.round(avgMood * 10) / 10,
    avgEnergy: Math.round(avgEnergy * 10) / 10,
    avgStress: Math.round(avgStress * 10) / 10,
    avgSleepQuality: Math.round(avgSleepQuality * 10) / 10,
    totalCheckins: total,
    bestDayOfWeek: DAY_NAMES[bestDay],
    worstDayOfWeek: DAY_NAMES[worstDay],
    energyLeakageWarnings: warnings,
  };
}

router.get("/patterns/summary", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  const emptyResponse = {
    avgMood: 0, avgEnergy: 0, avgStress: 0, avgSleepQuality: 0,
    totalCheckins: 0, bestDayOfWeek: null, worstDayOfWeek: null,
    bestConditionsClarity: "Not enough data yet. Complete at least 7 check-ins to see patterns.",
    bestConditionsCreativity: "Not enough data yet. Complete at least 7 check-ins to see patterns.",
    bestConditionsConnection: "Not enough data yet. Complete at least 7 check-ins to see patterns.",
    energyLeakageWarnings: [] as string[],
    weeklySummary: "Start checking in daily to build your pattern intelligence.",
    recentCheckins: [] as unknown[],
    patternInsight: null,
    recommendation: null,
    aiGenerated: false,
    cached: false,
  };

  if (!user) { res.json(emptyResponse); return; }

  const checkins = await db.select().from(dailyCheckinsTable)
    .where(eq(dailyCheckinsTable.userId, user.id))
    .orderBy(desc(dailyCheckinsTable.createdAt))
    .limit(30);

  if (checkins.length === 0) { res.json(emptyResponse); return; }

  const base = computeBasePatterns(checkins)!;

  const highEnergyDays = checkins.filter(c => c.energy >= 7);
  const clarityCondition = highEnergyDays.length > 0 && highEnergyDays[0].sleepQuality >= 7
    ? "Your clarity peaks when sleep quality is high and stress is below 4. Protect your mornings for important decisions."
    : "You tend to think most clearly on days with good sleep. Prioritize sleep hygiene for better cognitive function.";

  const creativeDays = checkins.filter(c => c.mood >= 7 && c.energy >= 6);
  const creativityCondition = creativeDays.length > 0
    ? "Creative flow happens most on high-mood, moderate-energy days. Schedule creative work when you feel emotionally open."
    : "Your creativity may be blocked by stress or fatigue. Lower stress first, then invite creative exploration.";

  const socialDays = checkins.filter(c => c.socialActivity && c.mood >= 6);
  const connectionCondition = socialDays.length > 0
    ? "Connection quality improves when your mood is above 6 and stress is managed. Schedule social time on your better days."
    : "Build connection when you feel resourced. Forced socializing on low-energy days can drain rather than nourish.";

  res.json({
    ...base,
    bestConditionsClarity: clarityCondition,
    bestConditionsCreativity: creativityCondition,
    bestConditionsConnection: connectionCondition,
    weeklySummary: `Over ${base.totalCheckins} check-ins, your average mood is ${base.avgMood}/10 with energy at ${base.avgEnergy}/10. ${base.bestDayOfWeek}s tend to be your strongest days. ${base.energyLeakageWarnings.length > 0 ? "Watch for the energy leakage patterns noted above." : "Your overall patterns look balanced."}`,
    recentCheckins: checkins.slice(0, 7),
    patternInsight: null,
    recommendation: null,
    aiGenerated: false,
    cached: false,
  });
});

router.post("/patterns/generate", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) { res.status(400).json({ error: "No user found" }); return; }

  const today = new Date().toISOString().split("T")[0];
  const forceRegenerate = req.body?.regenerate === true;

  const checkins = await db.select().from(dailyCheckinsTable)
    .where(eq(dailyCheckinsTable.userId, user.id))
    .orderBy(desc(dailyCheckinsTable.createdAt))
    .limit(30);

  const base = computeBasePatterns(checkins);

  const result = await generateContent({
    userId: user.id,
    type: "pattern_summary",
    referenceDate: today,
    forceRegenerate,
  });

  const aiContent = result.content as Record<string, unknown>;

  res.json({
    ...(base || { avgMood: 0, avgEnergy: 0, avgStress: 0, avgSleepQuality: 0, totalCheckins: 0, bestDayOfWeek: null, worstDayOfWeek: null, energyLeakageWarnings: [] }),
    bestConditionsClarity: aiContent.bestConditionsClarity,
    bestConditionsCreativity: aiContent.bestConditionsCreativity,
    bestConditionsConnection: aiContent.bestConditionsConnection,
    energyLeakageWarnings: aiContent.energyLeakageWarnings || base?.energyLeakageWarnings || [],
    weeklySummary: aiContent.weeklySummary,
    recentCheckins: checkins.slice(0, 7),
    patternInsight: aiContent.patternInsight || null,
    recommendation: aiContent.recommendation || null,
    aiGenerated: result.isAiGenerated,
    cached: result.cached,
  });
});

export default router;
