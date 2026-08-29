import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, addressProfilesTable, insertAddressProfileSchema, memoryItemsTable } from "@workspace/db";
import { scoreDigits, numberMeaning, personalCycles } from "@workspace/astro-engine";
import { requireUserId } from "../../lib/auth";
import { resolveBirth } from "../../lib/birth";

const router: IRouter = Router();

function addressFocus(number: number): { bestUse: string; focusToday: string; watchOut: string } {
  switch (number) {
    case 1: return { bestUse: "Independence, launches, personal agency, starting over.", focusToday: "Choose the thing that puts you back in authorship.", watchOut: "Isolation, impatience, doing everything alone." };
    case 2: return { bestUse: "Partnership, emotional regulation, peace, repair.", focusToday: "Make one relationship or home decision more harmonious.", watchOut: "Avoiding a direct conversation to keep the peace." };
    case 3: return { bestUse: "Creativity, visibility, expression, social flow.", focusToday: "Use the space for content, beauty, voice, or creative momentum.", watchOut: "Scattered energy and unfinished starts." };
    case 4: return { bestUse: "Structure, discipline, systems, health routines, stability.", focusToday: "Use this address to stabilize a plan, budget, body rhythm, or workflow.", watchOut: "Rigidity, dullness, feeling trapped by obligations." };
    case 5: return { bestUse: "Change, networking, movement, travel, experimentation.", focusToday: "Let the space support movement without losing the thread.", watchOut: "Restlessness, impulse, avoidance through novelty." };
    case 6: return { bestUse: "Home, family, beauty, care, devotion, responsibility.", focusToday: "Make the environment feel more regulating and supportive.", watchOut: "Overgiving, caretaking, guilt, perfectionism." };
    case 7: return { bestUse: "Study, privacy, intuition, healing, research, spiritual depth.", focusToday: "Protect focus. Use the space for depth, not noise.", watchOut: "Withdrawal, overthinking, disappearing from support." };
    case 8: return { bestUse: "Business, power, money, leadership, material results.", focusToday: "Turn an ambition into a measurable next move.", watchOut: "Pressure, control, burnout, measuring worth through outcomes." };
    case 9: return { bestUse: "Completion, service, art, compassion, release, legacy.", focusToday: "Close a loop or clear an old emotional pattern.", watchOut: "Carrying everyone else’s emotional weight." };
    default: return { bestUse: "Integration, reset, and observation.", focusToday: "Notice how the address changes your energy before judging it.", watchOut: "Projecting too much meaning onto one signal." };
  }
}

router.get("/addresses", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const addresses = await db
    .select()
    .from(addressProfilesTable)
    .where(eq(addressProfilesTable.userId, birth.userId))
    .orderBy(desc(addressProfilesTable.createdAt));
  res.json({ addresses });
});

router.post("/addresses", async (req, res): Promise<void> => {
  const userId = await requireUserId(req, res);
  if (userId === null) return;
  const birth = await resolveBirth(userId);
  if (!birth) {
    res.status(404).json({ error: "Complete your profile first" });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const addressInput = typeof body.addressInput === "string" ? body.addressInput.trim() : "";
  if (!addressInput) {
    res.status(400).json({ error: "Provide addressInput" });
    return;
  }
  const scored = scoreDigits(addressInput, "address");
  const focus = addressFocus(scored.value);
  const today = new Date().toISOString().slice(0, 10);
  const cycles = personalCycles(birth.birthDate, today);
  const payload = insertAddressProfileSchema.parse({
    userId: birth.userId,
    label: typeof body.label === "string" && body.label.trim() ? body.label.trim() : "Current home",
    addressInput,
    addressNumber: scored.value,
    context: "address",
    locationType: typeof body.locationType === "string" ? body.locationType : "current_home",
    startDate: typeof body.startDate === "string" ? body.startDate : null,
    endDate: typeof body.endDate === "string" ? body.endDate : null,
    bestUse: focus.bestUse,
    focusToday: `${focus.focusToday} Personal day ${cycles.personalDay} adds the daily tempo.`,
    watchOut: focus.watchOut,
  });
  const [created] = await db.insert(addressProfilesTable).values(payload).returning();
  const [memory] = await db.insert(memoryItemsTable).values({
    userId: birth.userId,
    sourceType: "address",
    sourceId: created.id,
    memoryType: "address",
    lifeArea: "home",
    title: `${created.label}: ${created.addressNumber} address`,
    summary: `${addressInput} carries a ${created.addressNumber} address vibration. Best use: ${created.bestUse}`,
    eventDate: today,
    places: [addressInput],
    tags: ["address", "numerology", `number-${created.addressNumber}`],
    confidence: 72,
    active: true,
    userConfirmed: false,
  }).returning();
  res.status(201).json({ address: created, memory, score: scored, meaning: numberMeaning(scored.value), today: { personalDay: cycles.personalDay, focus: created.focusToday } });
});

export default router;
