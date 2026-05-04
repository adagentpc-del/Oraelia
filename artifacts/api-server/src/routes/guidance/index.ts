import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, usersTable, profilesTable, generatedGuidanceTable, dailyCheckinsTable, goalsTable } from "@workspace/db";
import { logger } from "../../lib/logger";

const DEMO_GUIDANCE = {
  theme: "Integration and Clarity",
  bestUse: "Today favors deep focus work and important conversations. Your energy supports clear thinking and emotional intelligence.",
  avoid: "Avoid overcommitting or making impulsive decisions. Give yourself permission to say no to requests that don't align with your current priorities.",
  career: "Focus on one important project today rather than spreading your energy thin. Your clarity is strong — use it for strategic decisions or creative problem-solving.",
  relationship: "Lead with curiosity in conversations today. Someone close to you may need your full attention — listen before offering solutions.",
  body: "Your nervous system benefits from grounding today. Try a slow morning routine, warm liquids, and gentle movement. Avoid overstimulation from screens in the evening.",
  chakra: "Heart chakra is highlighted today. Practice compassion — for yourself first, then extend it outward. Place a hand on your chest and breathe deeply for two minutes.",
  moon: "The current moon phase supports reflection and intention-setting. Write down what you want to release and what you want to invite in.",
  goalNudge: "Take one small, concrete step toward your primary goal today. Progress compounds — even five minutes of focused effort counts.",
  action: "Write down three things you are grateful for this morning. Let gratitude set the tone for your day.",
  journalPrompt: "What pattern in your life is ready to shift? What would it feel like to let it go?",
  ritual: "Light a candle this evening and sit in silence for five minutes. Let the flame represent your intention for the week ahead.",
};

const router: IRouter = Router();

router.get("/guidance/today", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) { res.status(404).json({ error: "No user found" }); return; }

  const today = new Date().toISOString().split("T")[0];

  const [existing] = await db.select().from(generatedGuidanceTable)
    .where(and(eq(generatedGuidanceTable.userId, user.id), eq(generatedGuidanceTable.date, today)));

  if (!existing) {
    res.status(404).json({ error: "No guidance for today" });
    return;
  }

  res.json(existing);
});

router.post("/guidance/daily", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).orderBy(usersTable.id).limit(1);
  if (!user) { res.status(400).json({ error: "No user found" }); return; }

  const today = new Date().toISOString().split("T")[0];

  const [existing] = await db.select().from(generatedGuidanceTable)
    .where(and(eq(generatedGuidanceTable.userId, user.id), eq(generatedGuidanceTable.date, today)));

  if (existing) {
    res.json(existing);
    return;
  }

  let guidanceData = DEMO_GUIDANCE;
  let isAiGenerated = false;

  try {
    if (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
      const { openai } = await import("@workspace/integrations-openai-ai-server");

      const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, user.id));
      const recentCheckins = await db.select().from(dailyCheckinsTable)
        .where(eq(dailyCheckinsTable.userId, user.id))
        .orderBy(desc(dailyCheckinsTable.createdAt)).limit(3);
      const goals = await db.select().from(goalsTable)
        .where(eq(goalsTable.userId, user.id));

      const tone = profile?.guidanceTone || "practical";
      const profileContext = profile ? `
Name: ${profile.fullName}
Sun Sign: ${profile.sunSign || "Unknown"}
Life Path Number: ${profile.lifePathNumber || "Unknown"}
Career Stage: ${profile.careerStage || "Not specified"}
Top Goals: ${(profile.topGoals || []).join(", ") || "None specified"}
Guidance Tone Preference: ${tone}
Human Design Type: ${profile.hdType || "Unknown"}
` : "No profile data available.";

      const checkinContext = recentCheckins.length > 0
        ? recentCheckins.map(c => `Date: ${c.date}, Mood: ${c.mood}/10, Energy: ${c.energy}/10, Stress: ${c.stress}/10, Sleep: ${c.sleepQuality}/10`).join("\n")
        : "No recent check-ins.";

      const goalsContext = goals.length > 0
        ? goals.map(g => `${g.title} (${g.status})`).join(", ")
        : "No goals set.";

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        max_completion_tokens: 8192,
        messages: [
          {
            role: "system",
            content: `You are Oralia, a premium personal intelligence system. Generate daily guidance for the user based on their profile, recent check-ins, and goals. Use a ${tone} tone. Return JSON with these exact fields: theme, bestUse, avoid, career, relationship, body, chakra, moon, goalNudge, action, journalPrompt, ritual. Each field should be 1-3 sentences. Be specific and actionable.`
          },
          {
            role: "user",
            content: `Generate today's guidance.\n\nProfile:\n${profileContext}\n\nRecent Check-ins:\n${checkinContext}\n\nGoals: ${goalsContext}\n\nDate: ${today}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        guidanceData = {
          theme: parsed.theme || DEMO_GUIDANCE.theme,
          bestUse: parsed.bestUse || DEMO_GUIDANCE.bestUse,
          avoid: parsed.avoid || DEMO_GUIDANCE.avoid,
          career: parsed.career || DEMO_GUIDANCE.career,
          relationship: parsed.relationship || DEMO_GUIDANCE.relationship,
          body: parsed.body || DEMO_GUIDANCE.body,
          chakra: parsed.chakra || DEMO_GUIDANCE.chakra,
          moon: parsed.moon || DEMO_GUIDANCE.moon,
          goalNudge: parsed.goalNudge || DEMO_GUIDANCE.goalNudge,
          action: parsed.action || DEMO_GUIDANCE.action,
          journalPrompt: parsed.journalPrompt || DEMO_GUIDANCE.journalPrompt,
          ritual: parsed.ritual || DEMO_GUIDANCE.ritual,
        };
        isAiGenerated = true;
      }
    }
  } catch (err) {
    logger.warn({ err }, "AI guidance generation failed, using demo content");
  }

  const [guidance] = await db.insert(generatedGuidanceTable).values({
    userId: user.id,
    date: today,
    ...guidanceData,
    promptVersion: "v1",
    isAiGenerated,
  }).returning();

  res.json(guidance);
});

export default router;
