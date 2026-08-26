import { eq, and, desc } from "drizzle-orm";
import { db, generatedContentTable } from "@workspace/db";
import { buildUserContext, formatContextForPrompt, type UserContext } from "./user-context";
import {
  type PromptType,
  PROMPT_VERSIONS,
  getDailyGuidancePrompt,
  getWeeklyGuidancePrompt,
  getMonthlyGuidancePrompt,
  getRelationshipOverlayPrompt,
  getLocationStrategyPrompt,
  getPatternSummaryPrompt,
} from "./prompts";
import { logger } from "./logger";
import { PROMPT_INJECTION_GUARD, sanitizeForPrompt } from "./promptSafety";

interface GenerateOptions {
  userId: number;
  type: PromptType;
  referenceDate?: string;
  referenceId?: number;
  extraContext?: string;
  forceRegenerate?: boolean;
}

interface GenerateResult {
  content: Record<string, unknown>;
  isAiGenerated: boolean;
  promptVersion: string;
  cached: boolean;
  id: number;
  createdAt: Date;
}

export async function getCachedContent(
  userId: number,
  type: PromptType,
  referenceDate?: string,
  referenceId?: number,
): Promise<GenerateResult | null> {
  const version = PROMPT_VERSIONS[type];
  const conditions = [
    eq(generatedContentTable.userId, userId),
    eq(generatedContentTable.contentType, type),
    eq(generatedContentTable.promptVersion, version),
  ];

  if (referenceDate) {
    conditions.push(eq(generatedContentTable.referenceDate, referenceDate));
  }
  if (referenceId !== undefined) {
    conditions.push(eq(generatedContentTable.referenceId, referenceId));
  }

  const [existing] = await db
    .select()
    .from(generatedContentTable)
    .where(and(...conditions))
    .orderBy(desc(generatedContentTable.createdAt))
    .limit(1);

  if (!existing) return null;

  return {
    content: existing.content as Record<string, unknown>,
    isAiGenerated: existing.isAiGenerated,
    promptVersion: existing.promptVersion,
    cached: true,
    id: existing.id,
    createdAt: existing.createdAt,
  };
}

function getPromptForType(type: PromptType, tone: string) {
  switch (type) {
    case "daily_guidance": return getDailyGuidancePrompt(tone);
    case "weekly_guidance": return getWeeklyGuidancePrompt(tone);
    case "monthly_guidance": return getMonthlyGuidancePrompt(tone);
    case "relationship_overlay": return getRelationshipOverlayPrompt(tone);
    case "location_strategy": return getLocationStrategyPrompt(tone);
    case "pattern_summary": return getPatternSummaryPrompt(tone);
  }
}

function buildUserMessage(ctx: UserContext, type: PromptType, extraContext?: string): string {
  const base = formatContextForPrompt(ctx);
  let instruction = "";

  switch (type) {
    case "daily_guidance":
      instruction = `Generate today's daily guidance.`;
      break;
    case "weekly_guidance":
      instruction = `Generate this week's guidance overview.`;
      break;
    case "monthly_guidance":
      instruction = `Generate this month's planning guide.`;
      break;
    case "relationship_overlay":
      instruction = `Generate a relationship overlay analysis.`;
      break;
    case "location_strategy":
      instruction = `Generate a location strategy analysis.`;
      break;
    case "pattern_summary":
      instruction = `Generate a pattern intelligence analysis from the check-in data.`;
      break;
  }

  let message = `${instruction}\n\n${base}`;
  if (extraContext) {
    message += `\n\n== SPECIFIC CONTEXT ==\n${sanitizeForPrompt(extraContext, 2500)}`;
  }
  return message;
}

export async function generateContent(options: GenerateOptions): Promise<GenerateResult> {
  const { userId, type, referenceDate, referenceId, extraContext, forceRegenerate } = options;

  if (!forceRegenerate) {
    const cached = await getCachedContent(userId, type, referenceDate, referenceId);
    if (cached) return cached;
  }

  const ctx = await buildUserContext(userId);
  const tone = ctx.profile?.guidanceTone || "mystical";
  const version = PROMPT_VERSIONS[type];
  const prompt = getPromptForType(type, tone);
  const userMessage = buildUserMessage(ctx, type, extraContext);

  let content: Record<string, unknown>;
  let isAiGenerated = false;

  try {
    if (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
      const { openai } = await import("@workspace/integrations-openai-ai-server");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await openai.chat.completions.create(
          {
            model: "gpt-5-mini",
            max_completion_tokens: 8192,
            messages: [
              { role: "system", content: prompt.system + PROMPT_INJECTION_GUARD },
              { role: "user", content: userMessage },
            ],
            response_format: { type: "json_object" },
          },
          { signal: controller.signal },
        );

        const raw = response.choices[0]?.message?.content;
        if (raw) {
          content = JSON.parse(raw);
          isAiGenerated = true;
        } else {
          throw new Error("Empty AI response");
        }
      } finally {
        clearTimeout(timeout);
      }
    } else {
      throw new Error("AI not configured");
    }
  } catch (err) {
    logger.warn({ err, type }, "AI generation failed, using fallback content");
    content = getFallbackContent(type, ctx, extraContext);
  }

  if (forceRegenerate && referenceDate) {
    const deleteConditions = [
      eq(generatedContentTable.userId, userId),
      eq(generatedContentTable.contentType, type),
      eq(generatedContentTable.promptVersion, version),
      eq(generatedContentTable.referenceDate, referenceDate),
    ];
    if (referenceId !== undefined) {
      deleteConditions.push(eq(generatedContentTable.referenceId, referenceId));
    }
    await db.delete(generatedContentTable).where(and(...deleteConditions));
  } else if (forceRegenerate && referenceId !== undefined) {
    await db.delete(generatedContentTable).where(
      and(
        eq(generatedContentTable.userId, userId),
        eq(generatedContentTable.contentType, type),
        eq(generatedContentTable.promptVersion, version),
        eq(generatedContentTable.referenceId, referenceId),
      ),
    );
  }

  const [saved] = await db
    .insert(generatedContentTable)
    .values({
      userId,
      contentType: type,
      promptVersion: version,
      referenceDate: referenceDate || null,
      referenceId: referenceId || null,
      content,
      isAiGenerated,
    })
    .returning();

  return {
    content,
    isAiGenerated: saved.isAiGenerated,
    promptVersion: saved.promptVersion,
    cached: false,
    id: saved.id,
    createdAt: saved.createdAt,
  };
}

function getFallbackContent(type: PromptType, ctx: UserContext, extraContext?: string): Record<string, unknown> {
  const name = ctx.profile?.fullName || ctx.user.name;
  const sign = ctx.profile?.sunSign || "your sign";
  const hdType = ctx.profile?.hdType || "your type";

  switch (type) {
    case "daily_guidance":
      return {
        theme: "Integration and Clarity",
        bestUse: `Today favors deep focus work and important conversations. As a ${sign} with ${hdType} energy, your clarity is especially strong right now.`,
        avoid: "Avoid overcommitting or making impulsive decisions. Give yourself permission to say no to requests that don't align with your current priorities.",
        career: "Focus on one important project today rather than spreading your energy thin. Your clarity supports strategic decisions.",
        relationship: "Lead with curiosity in conversations today. Someone close to you may need your full attention.",
        body: "Your nervous system benefits from grounding today. Try a slow morning routine, warm liquids, and gentle movement.",
        chakra: "Heart chakra is highlighted today. Practice compassion — for yourself first, then extend it outward.",
        moon: "The current moon phase supports reflection and intention-setting. Write down what you want to release and what you want to invite in.",
        goalNudge: "Take one small, concrete step toward your primary goal today. Progress compounds.",
        action: "Write down three things you are grateful for this morning.",
        journalPrompt: "What pattern in your life is ready to shift? What would it feel like to let it go?",
        ritual: "Light a candle this evening and sit in silence for five minutes. Let the flame represent your intention for the week ahead.",
      };
    case "weekly_guidance":
      return {
        weekTheme: "Strategic Alignment",
        focus: `This week calls for ${name} to align daily actions with deeper intentions. As a ${sign}, you are entering a period where clarity and follow-through matter most.`,
        release: "Release the need to control outcomes. Trust the process and focus on what you can influence directly.",
        careerStrategy: "Prioritize your most important work early in the week when energy is highest. Save administrative tasks for later days.",
        relationshipFocus: "Give your closest relationships focused attention this week. Quality over quantity in all interactions.",
        bodyWisdom: "Your body is asking for consistency this week — regular sleep, meals, and movement will compound into noticeable energy gains.",
        energyMap: "Energy peaks mid-week. Monday and Tuesday for planning, Wednesday and Thursday for execution, Friday for reflection and social connection.",
        weeklyRitual: "Begin each morning with three deep breaths and a single intention for the day.",
        journalTheme: "What would my life look like if I fully trusted my own timing?",
        goalStrategy: "Choose one goal and give it focused attention for three dedicated sessions this week.",
      };
    case "monthly_guidance":
      return {
        monthTheme: "Foundation Building",
        intention: `${name}, this month invites you to build foundations that will support your next season of growth. As a ${sign} with Life Path energy, your focus on structure now will pay dividends later.`,
        careerMonth: "This is a planning and building month. Lay groundwork rather than seeking immediate results. The seeds you plant now will bloom in the coming months.",
        relationshipMonth: "Deepen existing connections rather than seeking new ones. Vulnerability with trusted people will strengthen your support system.",
        bodyMonth: "Establish or refine one health habit this month. Small, consistent changes will create lasting transformation.",
        bestWeeks: "Week 1 is ideal for planning and intention-setting. Weeks 2-3 favor execution and building. Week 4 is best for review and integration.",
        challenges: "Impatience may arise around mid-month. Remember that lasting change requires time. Resist the urge to abandon plans before they mature.",
        opportunities: "Watch for unexpected connections and conversations that open new doors. Say yes to at least one thing that feels slightly uncomfortable.",
        moonGuidance: "New moon energy at the start of the month supports fresh beginnings. Full moon invites release of what no longer serves you.",
        monthlyRitual: "On the first day of the month, write a letter to yourself describing the person you want to be by month's end.",
        reflectionPrompt: "What foundation am I building, and what will it support in six months?",
      };
    case "relationship_overlay":
      return {
        communicationPattern: "This relationship thrives with clear, intentional dialogue. Prioritize active listening and create space for both people to share openly.",
        emotionalActivation: "Emotional triggers may arise around themes of consistency and presence. Notice when you feel activated and practice a pause before responding.",
        repairLanguage: "After conflict, this relationship responds best to acknowledgment and gentle reconnection. A simple 'I see you and I am here' can go a long way.",
        conflictPattern: "Disagreements tend toward direct engagement. Name the pattern when you notice it and redirect toward collaborative problem-solving.",
        greenFlags: "Mutual respect, willingness to grow together, and consistent care are strengths in this dynamic.",
        redFlags: "Watch for patterns of over-giving, unspoken expectations, or avoiding difficult conversations for the sake of harmony.",
        bestCommunication: "Speak with intention and avoid assumptions. Use 'I feel' statements and check understanding before moving forward.",
        bestTiming: "Important conversations are best held when both people are rested and emotionally regulated — avoid late nights and high-stress moments.",
      };
    case "location_strategy": {
      return {
        bestUse: "This location supports your stated goals. Approach time here with clear intention and openness to what the environment offers.",
        whatToDo: "Explore local culture, establish routines that align with your goals, and be open to unexpected connections and opportunities.",
        whatNotToDo: "Avoid bringing old patterns into this new space. Do not rush to fill your schedule — leave room for discovery.",
        bestTimingStyle: "Plan visits during transitional periods in your life when you are most open to new perspectives and growth.",
        recommendedPurpose: "Use this location as a catalyst for the specific transformation you are seeking. Let the environment support your evolution.",
      };
    }
    case "pattern_summary":
      return {
        bestConditionsClarity: "Your clarity peaks when sleep quality is high and stress is below 4. Protect your mornings for important decisions.",
        bestConditionsCreativity: "Creative flow happens most on high-mood, moderate-energy days. Schedule creative work when you feel emotionally open.",
        bestConditionsConnection: "Connection quality improves when your mood is above 6 and stress is managed. Schedule social time on your better days.",
        energyLeakageWarnings: [],
        weeklySummary: "Start checking in daily to build your pattern intelligence.",
        bestDayOfWeek: null,
        worstDayOfWeek: null,
        patternInsight: "Your data shows emerging patterns that will become clearer with more check-ins. Consistency is the key to self-knowledge.",
        recommendation: "Commit to daily check-ins for the next two weeks to establish a reliable baseline for deeper pattern analysis.",
      };
  }
}
