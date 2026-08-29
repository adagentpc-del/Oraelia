import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  brainDumpsTable,
  memoryItemsTable,
  insertBrainDumpSchema,
  insertMemoryItemSchema,
} from "@workspace/db";
import { requireUserId } from "../../lib/auth";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

type Extraction = {
  summary: string;
  lifeArea: string;
  emotion?: string;
  urgency: "low" | "normal" | "high";
  goals: string[];
  people: string[];
  places: string[];
  tags: string[];
};

const AREA_KEYWORDS: Array<[string, RegExp]> = [
  ["career", /\b(work|job|client|business|career|launch|sales|money goal|meeting|presentation|boss|team|company|founder|build|ship)\b/i],
  ["relationship", /\b(date|dating|relationship|partner|boyfriend|girlfriend|husband|wife|friend|family|mother|mom|father|dad|texted|love|breakup|argument)\b/i],
  ["money", /\b(money|income|revenue|bill|debt|budget|pay|paid|price|cash|investor|loan|mortgage)\b/i],
  ["health", /\b(body|health|sleep|tired|energy|pain|stomach|cycle|period|workout|anxiety|stress|doctor)\b/i],
  ["home", /\b(home|house|apartment|condo|address|move|moving|room|balcony|city|location)\b/i],
  ["travel", /\b(trip|vacation|travel|flight|hotel|city|retreat|visit)\b/i],
  ["creativity", /\b(write|writing|content|video|design|art|creative|podcast|social|brand)\b/i],
  ["visibility", /\b(visible|visibility|stage|speaking|audience|press|public|followers|tiktok|instagram)\b/i],
];

function extractBrainDump(rawText: string): Extraction {
  const text = rawText.trim();
  const sentences = text.split(/[.!?\n]+/).map((part) => part.trim()).filter(Boolean);
  const summary = sentences.slice(0, 2).join(". ").slice(0, 420) || text.slice(0, 420);
  const lifeArea = AREA_KEYWORDS.find(([, pattern]) => pattern.test(text))?.[0] ?? "general";
  const urgency = /\b(urgent|today|now|panic|overwhelmed|deadline|asap|emergency|stuck|spiral)\b/i.test(text)
    ? "high"
    : /\b(later|someday|eventually|thinking about)\b/i.test(text)
      ? "low"
      : "normal";
  const emotion = /\b(overwhelmed|anxious|sad|angry|excited|hopeful|stressed|confused|tired|calm|happy)\b/i.exec(text)?.[0]?.toLowerCase();
  const goals = Array.from(text.matchAll(/\b(?:goal|trying to|need to|want to|working on)\s+([^.!?\n]{4,90})/gi)).map((m) => m[1].trim()).slice(0, 5);
  const places = Array.from(text.matchAll(/\b(?:in|to|from|near)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})\b/g)).map((m) => m[1]).slice(0, 5);
  const people = Array.from(text.matchAll(/\b(?:with|about|from)\s+([A-Z][A-Za-z]+)\b/g)).map((m) => m[1]).slice(0, 5);
  const tags = [lifeArea, urgency, ...(emotion ? [emotion] : [])];
  return { summary, lifeArea, emotion, urgency, goals, people, places, tags };
}

function planFromExtraction(extraction: Extraction): string {
  switch (extraction.lifeArea) {
    case "career":
      return extraction.urgency === "high"
        ? "Use the next clean power window for one concrete career action: send, pitch, ship, or decide. Do not split attention across five tasks."
        : "Treat this as career signal. Name the one outcome you want from today before you take action.";
    case "relationship":
      return "Slow the reaction loop. Write the truth first, then decide whether the timing is clean enough to say it today.";
    case "money":
      return "Make the money concern measurable: amount, deadline, next action, and what decision it requires.";
    case "health":
      return "Let the body signal change the schedule. Reduce friction, choose the gentlest effective action, and avoid overpromising.";
    case "home":
    case "travel":
      return "Log the place clearly so Oralia can compare it against location, address, and timing patterns over time.";
    default:
      return "This is now part of your living pattern record. Revisit it later to see whether it repeats or resolves.";
  }
}

router.get("/memory", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const memories = await db
    .select()
    .from(memoryItemsTable)
    .where(and(eq(memoryItemsTable.userId, birth.userId), eq(memoryItemsTable.active, true)))
    .orderBy(desc(memoryItemsTable.eventDate), desc(memoryItemsTable.createdAt));
  res.json({ memories });
});

router.get("/memory/summary", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const memories = await db
    .select()
    .from(memoryItemsTable)
    .where(and(eq(memoryItemsTable.userId, birth.userId), eq(memoryItemsTable.active, true)))
    .orderBy(desc(memoryItemsTable.createdAt));
  const byArea = memories.reduce<Record<string, number>>((acc, item) => {
    acc[item.lifeArea] = (acc[item.lifeArea] ?? 0) + 1;
    return acc;
  }, {});
  res.json({
    total: memories.length,
    byArea,
    recent: memories.slice(0, 8),
    note: "Memory is user-owned. Future guidance should cite which memories influenced a recommendation and let the user edit or delete them.",
  });
});

router.post("/memory/brain-dump", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const rawText = typeof body.rawText === "string" ? body.rawText.trim() : "";
  const inputMode = body.inputMode === "voice_transcript" ? "voice_transcript" : "text";
  const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
    ? body.date
    : new Date().toISOString().slice(0, 10);
  if (rawText.length < 4) {
    res.status(400).json({ error: "Brain dump must include at least a few words." });
    return;
  }

  const extraction = extractBrainDump(rawText);
  const brainDumpPayload = insertBrainDumpSchema.parse({
    userId: birth.userId,
    date,
    inputMode,
    rawText,
    extractedSummary: extraction.summary,
    primaryLifeArea: extraction.lifeArea,
    emotion: extraction.emotion,
    urgency: extraction.urgency,
    extractedGoals: extraction.goals,
    extractedPeople: extraction.people,
    extractedPlaces: extraction.places,
    shouldCreateMemory: true,
  });
  const [brainDump] = await db.insert(brainDumpsTable).values(brainDumpPayload).returning();

  const memoryPayload = insertMemoryItemSchema.parse({
    userId: birth.userId,
    sourceType: "brain_dump",
    sourceId: brainDump.id,
    memoryType: extraction.urgency === "high" ? "active_signal" : "observation",
    lifeArea: extraction.lifeArea,
    title: extraction.lifeArea === "general" ? "Daily brain dump" : `${extraction.lifeArea} brain dump`,
    summary: extraction.summary,
    eventDate: date,
    emotion: extraction.emotion,
    people: extraction.people,
    places: extraction.places,
    goals: extraction.goals,
    tags: extraction.tags,
    confidence: 65,
    active: true,
    userConfirmed: false,
  });
  const [memory] = await db.insert(memoryItemsTable).values(memoryPayload).returning();

  res.status(201).json({
    brainDump,
    memory,
    extraction,
    todayAdjustment: planFromExtraction(extraction),
    suggestedReminder: extraction.urgency === "high"
      ? {
          title: `Focus: ${extraction.lifeArea}`,
          body: planFromExtraction(extraction),
          relatedLifeArea: extraction.lifeArea,
          reminderType: "goal",
        }
      : null,
  });
});

router.patch("/memory/:id", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const id = parseInt(req.params.id ?? "", 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid memory id" });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const patch: Partial<typeof memoryItemsTable.$inferInsert> = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.summary === "string") patch.summary = body.summary;
  if (typeof body.lifeArea === "string") patch.lifeArea = body.lifeArea;
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.userConfirmed === "boolean") patch.userConfirmed = body.userConfirmed;
  const [updated] = await db
    .update(memoryItemsTable)
    .set(patch)
    .where(and(eq(memoryItemsTable.id, id), eq(memoryItemsTable.userId, birth.userId)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Memory not found" });
    return;
  }
  res.json(updated);
});

export default router;
