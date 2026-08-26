import { Router, type IRouter } from "express";
import { requireUserId } from "../../lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { db, lifeEventsTable, insertLifeEventSchema } from "@workspace/db";
import {
  computeNatalChart,
  computeTransits,
  annualProfection,
  ageAt,
  personalCycles,
  julianDayFromDate,
  currentRetrogrades,
} from "@workspace/astro-engine";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

const EVENT_TYPES = [
  "relationship_start", "relationship_end", "promotion", "termination", "launch",
  "revenue_milestone", "public_recognition", "move", "illness", "recovery",
  "family_event", "legal_event", "investment", "competition", "creative_release",
  "emotional_high", "emotional_low", "major_decision", "other",
];

router.get("/life-events", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const events = await db
    .select()
    .from(lifeEventsTable)
    .where(eq(lifeEventsTable.userId, birth.userId))
    .orderBy(desc(lifeEventsTable.eventDate));
  res.json({ events, eventTypes: EVENT_TYPES });
});

router.post("/life-events", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const parsed = insertLifeEventSchema.omit({ userId: true }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.data.eventDate)) {
    res.status(400).json({ error: "eventDate must be YYYY-MM-DD" });
    return;
  }
  const [created] = await db
    .insert(lifeEventsTable)
    .values({ ...parsed.data, userId: birth.userId })
    .returning();
  res.status(201).json(created);
});

router.delete("/life-events/:id", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const id = parseInt(req.params.id ?? "", 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const deleted = await db
    .delete(lifeEventsTable)
    .where(and(eq(lifeEventsTable.id, id), eq(lifeEventsTable.userId, birth.userId)))
    .returning();
  if (!deleted.length) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json({ success: true });
});

/**
 * Longitudinal analysis: what was active astrologically & numerologically
 * when this event happened. The stored facts, not AI guesses.
 */
router.get("/life-events/:id/analysis", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const id = parseInt(req.params.id ?? "", 10);
  const [event] = await db
    .select()
    .from(lifeEventsTable)
    .where(and(eq(lifeEventsTable.id, id), eq(lifeEventsTable.userId, birth.userId)));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const eventDate = new Date(`${event.eventDate}T12:00:00Z`);
  const jd = julianDayFromDate(eventDate);
  const chart = computeNatalChart(birth.moment);
  const transits = computeTransits(chart, jd).slice(0, 15);
  const age = ageAt(birth.moment, jd);
  const profection = annualProfection(chart, age);
  const cycles = personalCycles(birth.birthDate, event.eventDate);
  const retrogrades = currentRetrogrades(jd).filter((r) => r.retrograde);

  res.json({
    event,
    analysis: {
      ageAtEvent: age,
      profection,
      personalCycles: cycles,
      activeTransits: transits,
      retrogradesAtEvent: retrogrades,
      note: "These are the calculated timing factors active on the event date. Patterns emerge by comparing factors across multiple logged events of the same category.",
    },
  });
});

/** Aggregate pattern scan across all logged events of a category. */
router.get("/life-events/patterns/:category", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const category = req.params.category ?? "";
  const events = await db
    .select()
    .from(lifeEventsTable)
    .where(and(eq(lifeEventsTable.userId, birth.userId), eq(lifeEventsTable.category, category)))
    .orderBy(desc(lifeEventsTable.eventDate));
  if (events.length < 2) {
    res.json({
      category,
      events: events.length,
      patterns: [],
      note: "Log at least two events in this category to detect repeating timing factors.",
    });
    return;
  }

  const chart = computeNatalChart(birth.moment);
  const profectionHouses = new Map<number, number>();
  const personalYears = new Map<number, number>();
  for (const event of events) {
    const jd = julianDayFromDate(new Date(`${event.eventDate}T12:00:00Z`));
    const profection = annualProfection(chart, ageAt(birth.moment, jd));
    profectionHouses.set(profection.profectedHouse, (profectionHouses.get(profection.profectedHouse) ?? 0) + 1);
    const cycles = personalCycles(birth.birthDate, event.eventDate);
    personalYears.set(cycles.personalYear, (personalYears.get(cycles.personalYear) ?? 0) + 1);
  }
  const patterns: string[] = [];
  for (const [house, count] of profectionHouses) {
    if (count >= 2) {
      patterns.push(`${count} of ${events.length} "${category}" events happened in ${house}th-house profection years — this house's activations appear significant for you.`);
    }
  }
  for (const [year, count] of personalYears) {
    if (count >= 2) {
      patterns.push(`${count} of ${events.length} "${category}" events fell in personal year ${year} — watch the next one.`);
    }
  }
  res.json({ category, events: events.length, patterns });
});

export default router;
